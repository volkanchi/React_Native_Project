using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServisTakipApi.DTOs.Response
{
    public class Response<T>
    {
        public string Message { get; set; } = string.Empty!;
        public bool Success { get; set; }
        public T? Data { get; set; }
        public static Response<T> Fail(string message)
        {
            return new Response<T>
            {
                Success = false,
                Message = message,
                Data = default
            };
        }
        public static Response<T> Fail()
        {
            return new Response<T>
            {
                Success = false,
                Message = "hata",
                Data = default
            };
        }
        public static Response<T> Successful(string message, T data)
        {
            return new Response<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }
        public static Response<T> Successful(T data)
        {
            return new Response<T>
            {
                Success = true,
                Message = "işlem başarılı",
                Data = data
            };
        }
        public static Response<T> Successful(string message)
        {
            return new Response<T>
            {
                Success = true,
                Message = message,
                Data = default
            };
        }
        public static Response<T> Successful()
        {
            return new Response<T>
            {
                Success = true,
                Message = "işlem başarılı",
                Data = default
            };
        }
    }
}