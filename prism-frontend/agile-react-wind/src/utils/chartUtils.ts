
export const truncateTitle = (title: string, maxLength: number = 35) => {
  if (!title) return '';
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
};

export const getChartTitle = (chartOption: any) => {
  if (chartOption.title && chartOption.title.text) {
    return chartOption.title.text;
  }
  return 'Chart';
};

export const removeChartTitle = (chartOption: any) => {
  const optionCopy = { ...chartOption };
  delete optionCopy.title;
  return optionCopy;
};
