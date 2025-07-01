#lilly@l
from fastapi import FastAPI, HTTPException,Depends,Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from auth import create_access_token,get_current_user_id
from schemas import UserCreate, UserLogin, Token
from database import users_collection
from schemas import ConnectDB,AuthorizedTablesColumnsInfo,UserInput,CreateKPIRequest
import os
import json
from jose import JWTError, jwt
from bson.objectid import ObjectId
from typing import Dict
from dotenv import load_dotenv
from models import hash_password, verify_password, create_database_connection,add_extracted_schema,add_generated_semantics,get_extracted_schema,save_authorized_tables_columns_info,get_authorized_tables_columns_info,kpi_executor_on_db,get_databases
from tables_extractor import get_tables_and_columns
from visualizations import visualization_generator
from schema_extraction import schema_extractor
from semantic_extraction import semantic_extactor
from insert_data_into_vdb import vectordb_insertion
from conversationa_business_intelligence import  conversational_agent
from kpi import kpi_main
from database import db_visualizations

load_dotenv()
app = FastAPI()

oauth2_scheme=OAuth2PasswordBearer(tokenUrl="token")




app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/signup")
def singup(user:UserCreate):
    existing_user=users_collection.find_one({"email":user.email})
    if existing_user:
        raise HTTPException(status_code=400,detail="Email already registered")
    user_dict={
        "username":user.user_name, 
        "email":user.email,
        "hashed_password":hash_password(user.password)
    }
    result=users_collection.insert_one(user_dict)
    return {
        "message":"User created successfully",
        "user_id":str(result.inserted_id)
    }

@app.post("/login",response_model=Token)
def login(user:UserLogin):
    db_user=users_collection.find_one({"email":user.email})
    if not db_user or not verify_password(user.password,db_user["hashed_password"]):
        raise HTTPException(status_code=401,detail="Invalid email or password")
    access_token=create_access_token(data={"sub":str(db_user["_id"])})
    return {"access_token":access_token,"token_type":"bearer"}

@app.get("/user")
def get_current_user(user_id: str = Depends(get_current_user_id)):
    try:
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401,detail="Invaild token")
    
    try:
        user=users_collection.find_one({"_id":ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    if not user: 
        raise HTTPException(status_code=404,detail="User not found")
    return{
        "user_id":str(user["_id"]),
        "username":user["username"],
        "email":user["email"]
    }
@app.get("/connected-dbs")
def connectdbs(user_id:str=Depends(get_current_user_id)):
    response_databases=get_databases(user_id)
    return response_databases

@app.post("/connect-db")
def connect_db(db_info:ConnectDB,user_id: str = Depends(get_current_user_id)):
    try:
        # print(*db_info.model_dump())
        # print(db_info)
        db_tables=get_tables_and_columns(**db_info.model_dump())
        if db_tables:
            inserted_id=create_database_connection(db_info,user_id)
            return {"db_tables":db_tables,"db_id":inserted_id}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@app.post("/extract-schemas")
async def extract_schemas(
    payload: Dict = Body(...),
    user_id: str = Depends(get_current_user_id)
):
    try:
        # print(payload.get("db_id"))
        db_id = payload.get("db_id")
        selected_tables = payload.get("selected_tables")
        
        if not db_id or not selected_tables:
            raise HTTPException(status_code=400, detail="Missing db_id or selected_tables")
        
        authorized_tables_columns_info = AuthorizedTablesColumnsInfo(root=selected_tables)
        save_authorized_tables_columns_info(authorized_tables_columns_info.root, user_id, db_id)
        # print("db")
        response_schema = schema_extractor(authorized_tables_columns_info.root, user_id, db_id)
        # print("db")
        extracted_schema_db_response = add_extracted_schema(response_schema, user_id, db_id)
        
        return extracted_schema_db_response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-extracted-schemas")
def extracted_schemas(request:Dict,user_id: str = Depends(get_current_user_id)):
    db_id=request.get("db_id")
    response_check_schemas=get_extracted_schema(user_id,db_id)
    return response_check_schemas

@app.post("/semantic-extraction")
def semantic_extraction(request:Dict,user_id: str = Depends(get_current_user_id)):
    # print(authorized_tables_columns_info)
    db_id=request.get("db_id")
    print(db_id)
    authorized_tables_columns_info=get_authorized_tables_columns_info(user_id,db_id)
    # print("get info",authorized_tables_columns_info)
    semantic_response=semantic_extactor(authorized_tables_columns_info,user_id,db_id)

    extracted_semantics_db_response=add_generated_semantics(semantic_response,user_id,db_id)
    visualization_generator(user_id,db_id)
    return extracted_semantics_db_response


@app.post("/vector-data-insert")
def vector_data_insert(request:Dict,user_id: str = Depends(get_current_user_id)):
    db_id=request.get("db_id")
    vectordb_response=vectordb_insertion(user_id,db_id)
    return vectordb_response

@app.post("/conversational-bi")
def conversational_bi(request:Dict,user_id:str=Depends(get_current_user_id)):
    # print(data.user_input)
    
    return {"message":conversational_agent(request.get("user_input"),user_id,request.get("db_id"))}


@app.post("/kpi")
def create_kpi(request: CreateKPIRequest, user_id: str = Depends(get_current_user_id)):
    # Access the nested kpiData and db_id
    kpi_main(request.kpiData, user_id, request.db_id)
    return {"status": "success"}

@app.post("/get-kpi")
def get_user_kpi(request:Dict,user_id: str = Depends(get_current_user_id)):
    try:
        db_id=request.get("db_id")
        kpis_list_response = kpi_executor_on_db(user_id,db_id)
        # print("=======================================================")
        # print(kpis_list_response)
        # Return an empty list or dictionary if no KPIs found
        if kpis_list_response is None:
            return {
                "success": True,
                "message": "No KPIs found for the user.",
                "kpis": {}
            }
        
        return {
            "success": True,
            "message": "KPIs fetched successfully.",
            "kpis": kpis_list_response
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/get-visualization")
def visualization(request:Dict,user_id:str=Depends(get_current_user_id)):

    try:
        db_id=request.get("db_id")
        echart_response=db_visualizations.find_one({"user_id":user_id,"db_id":db_id},{'user_id': 0,'db_id':0})
        if echart_response:
            echart_response["_id"] = str(echart_response["_id"])
        return echart_response
    except Exception as e:
        raise e()
    
@app.post("/pin-visualization")
def pinVisualization(request:Dict,user_id:str=Depends(get_current_user_id)):
    try:
        result = db_visualizations.update_one(
            {"user_id": user_id, "db_id": request.get("db_id")},
            {
                "$set": {
                    "charts.$[chart].pinned": True
                }
            },
            array_filters=[{"chart.chart_id": request.get("chart_id")}]
        )

        if result.modified_count > 0:
            return {"status": "success", "message": "Visualization pinned successfully"}
        else:
            return {"status": "error", "message": "No visualization found to update"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}
   
  

