# SpareParts: supplier import

Version 0.3.0. Chrome / Edge (Manifest V3). One extension, separate adapters per supplier.

| Supplier | Supported pages | JSON supplier |
| --- | --- | --- |
| Armtek | https://etp.armtek.ru search results | Armtek |
| Truck Motors | https://market.tmtr.ru/goods/… | Tmtr |
| Favorit Parts | https://lk.favorit-parts.ru/analogues/… | FavoritParts |

## Установка и использование

1. В SpareParts откройте Контроль → Расширения. Скачайте ZIP и распакуйте в отдельную папку.
2. Откройте chrome://extensions (Chrome) или edge://extensions (Edge).
3. Включите режим разработчика, нажмите «Загрузить распакованное расширение» и выберите папку с manifest.json.
4. Откройте поддерживаемую страницу поставщика, нажмите значок расширения → «Собрать со страницы».
5. Проверьте поставщика, разделы и выбранные товары. Скопируйте или скачайте JSON.
6. В SpareParts откройте Товары → ⋯ → Импорт групп из JSON, вставьте данные и проверьте их перед записью.

Расширение читает только строки, присутствующие в DOM страницы. На Armtek сначала загрузите нужные результаты кнопкой «Показать ещё» и повторите сбор. На Truck Motors аналоги находятся в виртуальном списке: прокрутка может менять набор присутствующих строк, сбор не гарантирует все аналоги. Проверьте состав в предпросмотре. Автоматической прокрутки и накопления строк между сборами нет.

Повторы предложений одного артикула и производителя удаляются. Можно исключить раздел аналогов/замен и отдельные товары. До 1000 выбранных товаров экспортируются одной группой. При импорте полные кроссы объединят также существующие группы. Корзина и заказы для закупок пока не поддерживаются.

Для обновления замените файлы в той же папке и нажмите «Обновить» на карточке расширения.

## Installation and use

In SpareParts, open Control → Extensions, download and extract the ZIP. In chrome://extensions or edge://extensions, enable Developer mode and Load unpacked. Select the folder containing manifest.json. Open a supported supplier page, click the extension, collect and review products, then copy or download JSON. In SpareParts use Products → ⋯ → Import groups from JSON. Replace files in the same folder and reload the extension to update.

Only rows currently in the DOM are collected. On Armtek, load more results before collecting. Truck Motors alternatives use a virtual list: scrolling may replace rows; the collected group is not guaranteed to include all alternatives. There is no automatic scrolling or accumulation between scans. Review the group. Duplicate offers are removed; select sections and products. Up to 1000 selected products form one cross-reference group, including existing groups when imported. Purchase cart/order export is not supported yet.

## Kurulum ve kullanım

SpareParts üzerinde Kontrol → Eklentiler sayfasından ZIP'i indirip çıkarın. chrome://extensions veya edge://extensions üzerinde Geliştirici modunu açın ve Paketlenmemiş öğe yükle seçeneğiyle manifest.json içeren klasörü seçin. Desteklenen tedarikçi sayfasında eklentiyi açın, ürünleri toplayıp kontrol edin; JSON'u kopyalayın veya indirin. SpareParts üzerinde Ürünler → ⋯ → JSON'dan grup içe aktar seçeneğini kullanın. Güncellemek için aynı klasördeki dosyaları değiştirip eklentiyi yeniden yükleyin.

Yalnızca şu anda DOM'da bulunan satırlar toplanır. Armtek üzerinde önce daha fazla sonuç yükleyin. Truck Motors sanal liste kullanır: kaydırma satırları değiştirebilir; tüm alternatifler dahil olmayabilir. Otomatik kaydırma veya toplamalar arasında biriktirme yoktur. Grubu kontrol edin. Tekrarlanan teklifler çıkarılır, bölümler ve ürünler seçilebilir. En fazla 1000 seçili ürün bir grup oluşturur; mevcut kros grupları da birleştirilir. Sepet/sipariş üzerinden satın alma aktarımı henüz desteklenmez.

## Access and adding suppliers

No backend connection, tokens, cookies, remote scripts or background collection. Reading happens after clicking Collect from page, using activeTab and scripting. Clipboard access is used by Copy JSON. Exact HTTPS hosts and supported paths select adapters in suppliers.js. Collectors in adapters/ are self-contained functions for the browser's isolated world. Exports contain only supplier, producer, sku and name. Add an adapter and registry entry, update supported-page instructions/translations, bump the manifest version and include the adapter in the archive builder.
