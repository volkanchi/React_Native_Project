using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServisTakipApi.DTOs.Response
{
     
    /// API işlemleri için standart yanıt nesnesi
    /// Tüm API yanıtları bu yapıyı kullanarak Success, Message ve Data bilgileri gönderir
    
    /// <typeparam name="T">Yanıtta gönderilecek verinin tipi</typeparam>
    public class Response<T>
    {
         
        /// İşlemin açıklaması veya hata mesajı
        
        public string Message { get; set; } = string.Empty!;

         
        /// İşlemin başarılı olup olmadığını belirtir
        
        public bool Success { get; set; }

         
        /// İşlem sonucu döndürülen veri
        
        public T? Data { get; set; }

         
        /// Başarısız bir yanıt oluşturur (mesaj ile)
        
        /// <param name="message">Hata mesajı</param>
        /// <returns>Başarısız Response nesnesi</returns>
        public static Response<T> Fail(string message)
        {
            return new Response<T>
            {
                Success = false,
                Message = message,
                Data = default
            };
        }

         
        /// Başarısız bir yanıt oluşturur (varsayılan mesaj ile)
        
        /// <returns>Başarısız Response nesnesi</returns>
        public static Response<T> Fail()
        {
            return new Response<T>
            {
                Success = false,
                Message = "hata",
                Data = default
            };
        }

         
        /// Başarılı bir yanıt oluşturur (mesaj ve veri ile)
        
        /// <param name="message">Başarı mesajı</param>
        /// <param name="data">Döndürülecek veri</param>
        /// <returns>Başarılı Response nesnesi</returns>
        public static Response<T> Successful(string message, T data)
        {
            return new Response<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

         
        /// Başarılı bir yanıt oluşturur (veri ile)
        
        /// <param name="data">Döndürülecek veri</param>
        /// <returns>Başarılı Response nesnesi</returns>
        public static Response<T> Successful(T data)
        {
            return new Response<T>
            {
                Success = true,
                Message = "işlem başarılı",
                Data = data
            };
        }

         
        /// Başarılı bir yanıt oluşturur (mesaj ile, veri olmadan)
        
        /// <param name="message">Başarı mesajı</param>
        /// <returns>Başarılı Response nesnesi</returns>
        public static Response<T> Successful(string message)
        {
            return new Response<T>
            {
                Success = true,
                Message = message,
                Data = default
            };
        }

         
        /// Başarılı bir yanıt oluşturur (varsayılan mesaj ile)
        
        /// <returns>Başarılı Response nesnesi</returns>
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