// Backend'deki Response<T> sınıfının birebir karşılığı
export interface ApiResponse<T = undefined> {
  message: string;
  success: boolean;
  data?: T;
}