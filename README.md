### Notes
- Used `fetch` for `Http` requests.  
- Storing `InstrumentAndShare` data in `localStorage`.  
- Storing `ClosingPrices` data in `indexedDB`.  
- `Instrument.Symbol` characters are [cleaned](https://github.com/m-ahmadi/tse-browser-client/blob/master/tse.js#L143) from `zero-width` characters, `ك` and  `ي`.
- The price adjustment algorithm was ported from the [official Windows app](http://cdn.tsetmc.com/Site.aspx?ParTree=111A11).

Dependency | Why
-------|-------------
`big.js` | For price adjustment calculations.
`jalaali-js` | Only needed due to the `ShamsiDate` column.
`localforage` | For storing in `indexedDB`.
---

### API
Method | Description
-------|-------------
`tse.updateInstruments()` | Update instrument list. (InstrumentAndShare)
`tse.getPrices(symbols=[], ?settings={...})` | Update (if needed) and return prices of instruments.
_ | Default settings:
```javascript
{
  columns: [
    [4, 'date'],
    [6, 'open'],
    [7, 'high'],
    [8, 'low'],
    [9, 'last'],
    [10, 'close'],
    [12, 'vol']
  ],
  adjustPrices: 0,
  daysWithoutTrade: false,
  startDate: '20010321'
}
```
### Column indexes
index | name | fname
------|------|------------------
0  | CompanyCode    | کد شرکت
1  | LatinName      | نام لاتین
2  | Symbol         | نماد
3  | Name           | نام
4  | Date           | تاریخ میلادی
5  | ShamsiDate     | تاریخ شمسی
6  | PriceFirst     | اولین قیمت
7  | PriceMax       | بیشترین قیمت
8  | PriceMin       | کمترین قیمت
9  | LastPrice      | آخرین قیمت
10 | ClosingPrice   | قیمت پایانی
11 | Price          | ارزش
12 | Volume         | حجم
13 | Count          | تعداد معاملات
14 | PriceYesterday | قیمت دیروز

### Usage:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/big.js/5.2.2/big.min.js"></script>
<script src="path/to/jalaali-js.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/localforage/1.7.3/localforage.min.js"></script>
<script src="tse.js"></script>

<script>
  (async function () {
    await tse.updateInstruments(); // only needed once in a trading day.
    const data = await tse.getPrices(['ذوب', 'فولاد']);
    const adjustedData = await tse.getPrices(['خساپا'], {adjustPrices: 1});
	
    const customCols1= await tse.getPrices(['شپنا'], {columns: [4,7,8]}); // default names
    const customCols2= await tse.getPrices(['شپنا'], {columns: [[4,'DATE'],[7,'MAX'],[8,'MIN']]}); // custom names
		
    console.table(tse.columnList); // view column indexes and their names
  })()
</script>
```