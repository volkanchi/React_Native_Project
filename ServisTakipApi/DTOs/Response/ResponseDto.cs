using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServisTakipApi.DTOs.Response
{
    /// <summary>
    /// API işlemleri için standart yanıt nesnesi
    /// Tüm API yanıtları bu yapıyı kullanarak Success, Message ve Data bilgileri gönderir
    /// </summary>
    /// <typeparam name="T">Yanıtta gönderilecek verinin tipi</typeparam>
    public class Response<T>
    {
        /// <summary>
        /// İşlemin açıklaması veya hata mesajı
        /// </summary>
        public string Message { get; set; } = string.Empty!;

        /// <summary>
        /// İşlemin başarılı olup olmadığını belirtir
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// İşlem sonucu döndürülen veri
        /// </summary>
        public T? Data { get; set; }

        /// <summary>
        /// Başarısız bir yanıt oluşturur (mesaj ile)
        /// </summary>
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

        /// <summary>
        /// Başarısız bir yanıt oluşturur (varsayılan mesaj ile)
        /// </summary>
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

        /// <summary>
        /// Başarılı bir yanıt oluşturur (mesaj ve veri ile)
        /// </summary>
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

        /// <summary>
        /// Başarılı bir yanıt oluşturur (veri ile)
        /// </summary>
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

        /// <summary>
        /// Başarılı bir yanıt oluşturur (mesaj ile, veri olmadan)
        /// </summary>
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

        /// <summary>
        /// Başarılı bir yanıt oluşturur (varsayılan mesaj ile)
        /// </summary>
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