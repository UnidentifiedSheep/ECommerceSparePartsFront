# SpareParts: Armtek

Version 0.1.0. Chrome / Edge (Manifest V3).

## Установка

1. Распакуйте ZIP в отдельную папку. Файл manifest.json должен лежать в её корне.
2. Откройте chrome://extensions (Chrome) или edge://extensions (Edge).
3. Включите режим разработчика, нажмите «Загрузить распакованное расширение» и выберите эту папку.
4. Откройте результаты поиска товара на https://etp.armtek.ru и нажмите значок расширения.
5. Нажмите «Собрать со страницы», проверьте разделы и выбранные товары, скопируйте или скачайте JSON.
6. В SpareParts откройте Товары → ⋯ → Импорт групп из JSON и вставьте данные.

Для обновления замените файлы в той же папке и нажмите «Обновить» на карточке расширения.

Расширение читает только загруженные строки таблицы поиска. Для остальных результатов сначала нажмите «Показать ещё» на Armtek и повторите сбор. Скрытые фильтрами строки не включаются. Повторы предложений одного артикула и производителя удаляются. Можно исключить раздел «Возможные замены» и отдельные товары. Выбранные товары экспортируются одной группой, до 1000 товаров. Перед записью фронт снова показывает предпросмотр; полные кроссы объединят также существующие группы.

Сейчас поддержан только сбор группы товаров из поиска Armtek. Корзина и заказы для закупки пока не поддерживаются.

## Installation

Extract the ZIP. In chrome://extensions or edge://extensions, enable Developer mode, choose Load unpacked and select the folder containing manifest.json. Open Armtek product search results, click the extension, collect and review products, then copy or download JSON. In SpareParts use Products → ⋯ → Import groups from JSON. To update, replace files in the same folder and reload the extension.

Only loaded search rows are collected. Load more results on Armtek and collect again if needed. Filtered-out rows are excluded. Duplicate offers are removed; select sections and individual products before export. A maximum of 1000 selected products form one cross-reference group, including existing cross-reference groups when imported. Cart/order purchase export is not supported yet.

## Kurulum

ZIP'i çıkarın. chrome://extensions veya edge://extensions üzerinde Geliştirici modunu açın, Paketlenmemiş öğe yükle seçeneğiyle manifest.json içeren klasörü seçin. Armtek ürün arama sonuçlarında eklentiyi açıp ürünleri toplayın ve kontrol edin; JSON'u kopyalayın veya indirin. SpareParts üzerinde Ürünler → ⋯ → JSON'dan grup içe aktar seçeneğini kullanın. Güncellemek için aynı klasördeki dosyaları değiştirip eklentiyi yeniden yükleyin.

Yalnızca yüklenen arama satırları toplanır. Gerekirse Armtek üzerinde daha fazla sonuç yükleyip tekrar toplayın. Filtrelerle gizlenen satırlar dahil edilmez. Tekrarlanan teklifler çıkarılır; bölümleri ve ürünleri seçebilirsiniz. En fazla 1000 seçili ürün bir kros grubu oluşturur; içe aktarılırken mevcut gruplar da birleştirilir. Sepet/sipariş üzerinden satın alma aktarımı henüz desteklenmez.

## Access

No backend connection, account tokens, cookies or background collection. Reading happens only after clicking Collect from page, using activeTab and scripting. Clipboard access is used only by Copy JSON. Supplier detection requires the exact https://etp.armtek.ru hostname. Opening the popup alone does not read page contents. Exports contain only supplier, producer, sku and name. All code is packaged locally; no remote scripts or network calls.
