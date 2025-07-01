from openai import AzureOpenAI
from models import get_semantic_data, get_database_connection
import json
import uuid
from sqlalchemy import create_engine, text
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy.engine import RowMapping
from database import db_visualizations


def get_sql_queries(user_id, db_id):
    """Generate SQL queries for visualization based on database semantics."""
    semantics = get_semantic_data(user_id, db_id)
    
    prompt = f"""
You are a data analyst assistant. I will provide you with a database semantics.

semantics:
{semantics}

Based on this, generate a list of SQL queries that return data suitable for visualizing common business metrics using Apache ECharts.
don't include id(s) in the chart that don't make any sense.
Each item should be a valid JSON object with:
- "chart_type": chart type (e.g., Line, Bar, Pie, Scatter, Radar)
- "description": what the chart will show
- "sql": a self-contained, ready-to-run SQL query optimized for aggregated visualization

Only include a chart if it's meaningful based on the schema. Skip time-based or radar charts if no suitable columns exist.

Return ONLY a JSON array, no notes, no markdown, no explanation. Ensure the JSON is valid and directly usable with `json.loads()`.
Don't add ```json or ``` in the response.

Output format:
[
  {{
    "chart_type": "Line",
    "description": "Revenue trends over time by month",
    "sql": "SELECT DATE_TRUNC('month', order_date) AS month, SUM(revenue) AS total_revenue FROM orders GROUP BY month ORDER BY month"
  }},
  {{
    "chart_type": "Bar",
    "description": "Number of products in each category",
    "sql": "SELECT category, COUNT(*) AS product_count FROM products GROUP BY category"
  }}
]
"""

    client = AzureOpenAI(
    azure_deployment="gpt-4o",
    api_version="2024-12-01-preview",
    )
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4
    )
    
    sql_queries_response = response.choices[0].message.content
    return json.loads(sql_queries_response)


class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for handling special data types."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, RowMapping):
            return dict(obj)
        return super().default(obj)


def execute_sql_queries(queries, user_id, db_id):
    """Execute SQL queries and return results with proper error handling."""
    database_info = get_database_connection(user_id, db_id)
    
    # Construct DB connection URL
    db_type = database_info.get("db_type")
    if db_type == "postgresql":
        # schema = "alpl_prod"
        # db_url = f"postgresql+psycopg2://{database_info['username']}:{database_info['password']}@{database_info['host']}:{database_info['port']}/{database_info['database']}?connect_timeout=10&options=-csearch_path%3D{schema}"
        db_url = f"postgresql+psycopg2://{database_info['username']}:{database_info['password']}@{database_info['host']}:{database_info['port']}/{database_info['database']}?connect_timeout=10"
    elif db_type == "mysql":
        db_url = f"mysql+pymysql://{database_info['username']}:{database_info['password']}@{database_info['host']}:{database_info['port']}/{database_info['database']}"
    else:
        raise ValueError("Unsupported database type. Only 'postgresql' and 'mysql' are supported.")

    results = []
    engine = create_engine(db_url)

    for item in queries:
        chart_type = item.get("chart_type")
        description = item.get("description")
        sql = item.get("sql")

        # Create a new connection for each query
        try:
            with engine.connect() as connection:
                # Start a new transaction
                with connection.begin():
                    try:
                        result = connection.execute(text(sql))
                        rows = result.mappings().all()
                        results.append({
                            "chart_type": chart_type,
                            "description": description,
                            "sql": sql,
                            "data": rows
                        })
                    except Exception as query_error:
                        results.append({
                            "chart_type": chart_type,
                            "description": description,
                            "sql": sql,
                            "error": str(query_error),
                            "data": []
                        })
        except Exception as conn_error:
            results.append({
                "chart_type": chart_type,
                "description": description,
                "sql": sql,
                "error": str(conn_error),
                "data": []
            })

    return results


def generate_echarts_from_data(chart_definitions):
    """Generate ECharts configuration from query results."""
    def convert(val):
        """Convert database values to chart-friendly formats."""
        if isinstance(val, (datetime, date)):
            return val.isoformat()
        elif isinstance(val, Decimal):
            return float(val)
        elif isinstance(val, RowMapping):
            return dict(val)  # Convert ISO date to 'YYYY-MM-DD'
        return val

    def get_option(chart):
        """Generate chart-specific configuration."""
        chart_type = chart.get("chart_type", "Bar")
        description = chart.get("description", "Untitled Chart")
        data = chart.get("data", [])
        error = chart.get("error")

        if error or not data:
            return {
                "title": {"text": description},
                "series": [],
                "error": error or "No data available"
            }

        if not data:
            return {"title": {"text": description}, "series": []}

        keys = list(data[0].keys()) if data else []

        # Line Chart
        if chart_type == "Line":
            return {
                "title": {"text": description},
                "tooltip": {"trigger": "axis"},
                "xAxis": {"type": "category", "data": [convert(row[keys[0]]) for row in data]},
                "yAxis": {"type": "value"},
                "series": [{
                    "data": [convert(row[keys[1]]) for row in data],
                    "type": "line",
                    "smooth": True
                }]
            }

        # Bar Chart
        elif chart_type == "Bar":
            return {
                "title": {"text": description},
                "tooltip": {"trigger": "axis"},
                "xAxis": {"type": "category", "data": [str(row[keys[0]]) for row in data]},
                "yAxis": {"type": "value"},
                "series": [{
                    "data": [convert(row[keys[1]]) for row in data],
                    "type": "bar"
                }]
            }

        # Pie Chart
        elif chart_type == "Pie":
            return {
                "title": {"text": description, "left": "center"},
                "tooltip": {"trigger": "item"},
                "series": [{
                    "type": "pie",
                    "radius": "50%",
                    "data": [
                        {"value": convert(row[keys[1]]), "name": str(row[keys[0]])}
                        for row in data
                    ],
                    "emphasis": {
                        "itemStyle": {
                            "shadowBlur": 10,
                            "shadowOffsetX": 0,
                            "shadowColor": "rgba(0, 0, 0, 0.5)"
                        }
                    }
                }]
            }

        # Scatter Chart
        elif chart_type == "Scatter":
            return {
                "title": {"text": description},
                "tooltip": {"trigger": "item"},
                "xAxis": {"type": "value", "name": keys[0]},
                "yAxis": {"type": "value", "name": keys[1]},
                "series": [{
                    "symbolSize": 10,
                    "type": "scatter",
                    "data": [
                        [convert(row[keys[0]]), convert(row[keys[1]])]
                        for row in data
                    ]
                }]
            }

        # Radar Chart
        elif chart_type == "Radar" and len(keys) > 1:
            indicators = [
                {"name": key, "max": max(convert(row[key]) for row in data)}
                for key in keys[1:]
            ]
            values = [convert(data[0][key]) for key in keys[1:]]
            return {
                "title": {"text": description},
                "tooltip": {},
                "radar": {"indicator": indicators},
                "series": [{
                    "type": "radar",
                    "data": [{
                        "value": values,
                        "name": str(data[0][keys[0]])
                    }]
                }]
            }

        # Default fallback
        return {
            "title": {"text": description},
            "series": [],
            "error": f"Unsupported chart type: {chart_type}" if chart_type else "No chart type specified"
        }

    return [get_option(chart) for chart in chart_definitions]


def visualization_generator(user_id, db_id):
    """Main function to generate and store visualizations."""
    try:
        # Step 1: Generate SQL queries
        sql_query_response = get_sql_queries(user_id, db_id)
        print("--------------------------------------")
        print(sql_query_response)
        # Step 2: Execute queries
        sql_query_executer_response = execute_sql_queries(sql_query_response, user_id, db_id)
        print("======================================")
        print(sql_query_executer_response)
        # Step 3: Generate ECharts configurations
        gen_chat_response = generate_echarts_from_data(sql_query_executer_response)
        print("**************************************")
        print(gen_chat_response)
        # Step 4: Add metadata and store in database
        for viz_obj in gen_chat_response:
            viz_obj["pinned"] = False
            viz_obj["chart_id"] = str(uuid.uuid4())[:8]
        
        db_visualizations.insert_one({
            "charts": gen_chat_response,
            "user_id": user_id,
            "db_id": db_id,
            "created_at": datetime.utcnow()
        })
        
        return {"status": "success", "message": "Visualizations generated successfully"}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}