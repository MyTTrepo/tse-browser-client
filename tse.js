(function () {

let API_URL = 'http://service.tsetmc.com/tsev2/data/TseClient2.aspx';

const rq = {
  Instrument(DEven) {
    const params = {
      t: 'Instrument',
      a: ''+DEven
    };
    return this.makeRequest(params);
  },
  InstrumentAndShare(DEven, LastID=0) {
    const params = {
      t: 'InstrumentAndShare',
      a: ''+DEven,
      a2: ''+LastID
    };
    return this.makeRequest(params);
  },
  LastPossibleDeven() {
    const params = {
      t: 'LastPossibleDeven'
    };
    return this.makeRequest(params);
  },
  ClosingPrices(insCodes) {
    const params = {
      t: 'ClosingPrices',
      a: ''+insCodes
    };
    return this.makeRequest(params);
  },
  makeRequest(params) {
    const url = new URL(API_URL);
    url.search = new URLSearchParams(params).toString();
    
    return new Promise((resolve, reject) => {
      fetch(url).then(async res => {
        res.status === 200 ? resolve(await res.text()) : reject(res.status +' '+ res.statusText);
      }).catch(err => reject(err));
    });
    
    /* return $.ajax({
      url: API_URL,
      method: 'GET',
      data: params
    }); */
  }
};
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// structs
class ClosingPrice {
  constructor(_row='') {
    const row = _row.split(',');
    if (row.length !== 11) throw new Error('Invalid ClosingPrice data!');
    this.InsCode        = row[0];  // int64
    this.DEven          = row[1];  // int32 (the rest are all decimal)
    this.PClosing       = row[2];  // close
    this.PDrCotVal      = row[3];  // last
    this.ZTotTran       = row[4];  // count
    this.QTotTran5J     = row[5];  // volume
    this.QTotCap        = row[6];  // price
    this.PriceMin       = row[7];  // low
    this.PriceMax       = row[8];  // high
    this.PriceYesterday = row[9];  // yesterday
    this.PriceFirst     = row[10]; // open
  }
}
const cols  = ['CompanyCode', 'LatinName', 'Symbol', 'Name', 'Date', 'ShamsiDate', 'PriceFirst', 'PriceMax', 'PriceMin', 'LastPrice', 'ClosingPrice', 'Price', 'Volume', 'Count', 'PriceYesterday'];
const colsFa = ['کد شرکت', 'نام لاتین', 'نماد', 'نام', 'تاریخ میلادی', 'تاریخ شمسی', 'اولین قیمت', 'بیشترین قیمت', 'کمترین قیمت', 'آخرین قیمت', 'قیمت پایانی', 'ارزش', 'حجم', 'تعداد معاملات', 'قیمت دیروز'];
class Column {
  constructor(row=[]) { 
    const len = row.length;
    if (len > 2 || len < 1) throw new Error('Invalid Column data!');
    this.name   = cols[ row[0] ];
    this.fname  = colsFa[ row[0] ];
    this.header = row[1];
  }
}
class Instrument {
  constructor(_row='') {
    const row = _row.split(',');
    if (row.length !== 18) throw new Error('Invalid Instrument data!');
    this.InsCode      = row[0];         // int64 (long)
    this.InstrumentID = row[1];
    this.LatinSymbol  = row[2];
    this.LatinName    = row[3];
    this.CompanyCode  = row[4];
    this.Symbol       = cleanFa(row[5]);
    this.Name         = row[6];
    this.CIsin        = row[7];
    this.DEven        = row[8];         // int32 (int)
    this.Flow         = row[9];         // 0,1,2,3,4,5,6,7 بازار byte
    this.LSoc30       = row[10];        // نام 30 رقمي فارسي شرکت
    this.CGdSVal      = row[11];        // A,I,O نوع نماد
    this.CGrValCot    = row[12];        // 00,11,1A,...25 کد گروه نماد
    this.YMarNSC      = row[13];        // NO,OL,BK,BY,ID,UI کد بازار
    this.CComVal      = row[14];        // 1,3,4,5,6,7,8,9 کد تابلو
    this.CSecVal      = row[15].trim(); // []62 کد گروه صنعت
    this.CSoSecVal    = row[16].trim(); // []177 کد زير گروه صنعت
    this.YVal         = row[17];        // string نوع نماد
  }
}
class Share {
  constructor(_row='') {
    const row = _row.split(',');
    if (row.length !== 5) throw new Error('Invalid Share data!');
    this.Idn              = row[0];      // long
    this.InsCode          = row[1];      // long
    this.DEven            = row[2];      // int
    this.NumberOfShareNew = parseInt( row[3] ); // Decimal
    this.NumberOfShareOld = parseInt( row[4] ); // Decimal
  }
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// utils
function parseInstruments(struct=false, arr=false, structKey='InsCode') {
  const rows = localStorage.getItem('tse.instruments').split(';');
  const instruments = arr ? [] : {};
  for (const row of rows) {
    const item = struct ? new Instrument(row) : row;
    if (arr) {
      instruments.push(item);
    } else {
      const key = struct ? item[structKey] : row.match(/^\d+\b/)[0];
      instruments[key] = item;
    }
  }
  return instruments;
}
function parseShares(struct=false, arr=false, structKey='InsCode') {
  const rows = localStorage.getItem('tse.shares').split(';');
  const shares = arr ? [] : {};
  for (const row of rows) {
    const item = struct ? new Share(row) : row;
    if (arr) {
      shares.push(item);
    } else {
      const key = struct ? item[structKey] : row.split(',', 2)[1];
      shares[key] = item;
    }
  }
  return shares;
}
function dateToStr(d) {
  return (d.getFullYear()*10000) + ( (d.getMonth()+1)*100 ) + d.getDate() + '';
}
function strToDate(s) {
  return new Date( +s.slice(0,4), +s.slice(4,6)-1, +s.slice(6,8) );
}
function cleanFa(str) {
  return str
    // .replace(/[\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/\u200B/g, '')        // zero-width space
    .replace(/\s?\u200C\s?/g, ' ') // zero-width non-joiner
    .replace(/\u200D/g, '')        // zero-width joiner
    .replace(/\uFEFF/g, '')        // zero-width no-break space
    .replace(/ك/g,'ک')
    .replace(/ي/g,'ی');
}
function gregToShamsi(s) {
  const { jy, jm, jd } = jalaali.toJalaali(+s.slice(0,4), +s.slice(4,6), +s.slice(6,8));
  return (jy*10000) + (jm*100) + jd + '';
}
function shamsiToGreg(s) {
  const { gy, gm, gd } = jalaali.toGregorian(+s.slice(0,4), +s.slice(4,6), +s.slice(6,8));
  return (gy*10000) + (gm*100) + gd + '';
}
function dayDiff(s1, s2) {
  const date1 = +new Date(+s1.slice(0,4), +s1.slice(4,6)-1, +s1.slice(6,8));
  const date2 = +new Date(+s2.slice(0,4), +s2.slice(4,6)-1, +s2.slice(6,8));
  const diffTime = Math.abs(date2 - date1);
  const msPerDay = (1000 * 60 * 60 * 24);
  const diffDays = Math.ceil(diffTime / msPerDay);
  return diffDays;
}
function splitArr(arr, size){
  return arr
    .map( (v, i) => i % size === 0 ? arr.slice(i, i+size) : undefined )
    .filter(i => i);
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// price helpers
Big.DP = 40; // max decimal places
Big.RM = 2;  // rounding mode: http://mikemcl.github.io/big.js/#rm
function adjust(cond, closingPrices, shares, insCode) {
  const cp = closingPrices;
  const len = closingPrices.length;
  const res = [];
  if ( (cond === 1 || cond === 2) && len > 1 ) {
    let gaps = new Big('0.0');
    let num = new Big('1.0');
    res.push( cp[len-1] );
    if (cond === 1) {
      for (let i=len-2; i>=0; i-=1) {
        if ( !Big(cp[i].PClosing).eq(cp[i+1].PriceYesterday) ) {
          gaps = gaps.plus(1);
        }
      }
    }
    if ( (cond === 1 && gaps.div(len).lt('0.08')) || cond === 2 ) {
      for (let i=len-2; i>=0; i-=1) {
        const curr = cp[i];
        const next = cp[i+1];
        const pricesDontMatch = !Big(curr.PClosing).eq(next.PriceYesterday);
        const targetShare = shares.find(share => share.InsCode === insCode && share.DEven === next.DEven);
        
        if (cond === 1 && pricesDontMatch) {
          num = num.times(next.PriceYesterday).div(curr.PClosing);
        } else if (cond === 2 && pricesDontMatch && targetShare) {
          const oldShares = targetShare.NumberOfShareOld;
          const newShares = targetShare.NumberOfShareNew;
          num = num.times(oldShares).div(newShares);
        }
        
        let
        close = num.times(curr.PClosing).round(2).toFixed(2),
        last  = num.times(curr.PDrCotVal).round(2).toFixed(2),
        low   = num.times(curr.PriceMin).round().toString(),
        high  = num.times(curr.PriceMax).round().toString(),
        yday  = num.times(curr.PriceYesterday).round().toString(),
        first = num.times(curr.PriceFirst).round(2).toFixed(2);
        
        const adjustedClosingPrice = {
          InsCode:        curr.InsCode,
          DEven:          curr.DEven,
          PClosing:       close,           // close
          PDrCotVal:      last,            // last
          ZTotTran:       curr.ZTotTran,
          QTotTran5J:     curr.QTotTran5J,
          QTotCap:        curr.QTotCap,
          PriceMin:       low,             // low
          PriceMax:       high,            // high
          PriceYesterday: yday,            // yesterday
          PriceFirst:     first            // first
        };
        
        res.push(adjustedClosingPrice);
      }
    }
  }
  return res.reverse();
  // return res;
}
function getCell(columnName, instrument, closingPrice) {
  const c = columnName;
  const str =
    c === 'CompanyCode'    ? instrument.CompanyCode :
    c === 'LatinName'      ? instrument.LatinName :
    c === 'Symbol'         ? instrument.Symbol.replace(' ', '_') :
    c === 'Name'           ? instrument.Name.replace(' ', '_') :
    c === 'Date'           ? closingPrice.DEven :
    c === 'ShamsiDate'     ? gregToShamsi(closingPrice.DEven) :
    c === 'PriceFirst'     ? closingPrice.PriceFirst :
    c === 'PriceMax'       ? closingPrice.PriceMax :
    c === 'PriceMin'       ? closingPrice.PriceMin :
    c === 'LastPrice'      ? closingPrice.PDrCotVal :
    c === 'ClosingPrice'   ? closingPrice.PClosing :
    c === 'Price'          ? closingPrice.QTotCap:
    c === 'Volume'         ? closingPrice.QTotTran5J :
    c === 'Count'          ? closingPrice.ZTotTran :
    c === 'PriceYesterday' ? closingPrice.PriceYesterday : '';
  
  return str;
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
let UPDATE_INTERVAL           = 1;
let PRICES_UPDATE_CHUNK       = 10;
let PRICES_UPDATE_CHUNK_DELAY = 500;
let PRICES_UPDATE_RETRY_COUNT = 3;
let PRICES_UPDATE_RETRY_DELAY = 5000;
const defaultSettings = {
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
};
const { warn } = console;

const storedPrices = {};

async function parseStoredPrices() {
  const storedStr = await localforage.getItem('tse.prices');
  if (!storedStr) return storedPrices;
  
  const strs = storedStr.split('@');
  for (let i=0, n=strs.length; i<n; i++) {
    const str = strs[i];
    if (!str) continue;
    storedPrices[ str.match(/^\b\d+\b/)[0] ] = str;
  }
}

async function getLastPossibleDeven() {
  let lastPossibleDeven = localStorage.getItem('tse.lastPossibleDeven');
  
  let shouldUpdate;
  
  if (lastPossibleDeven) {
    const today = new Date();
    const daysPassed = dayDiff(dateToStr(today), lastPossibleDeven);
    const inWeekend = [4,5].includes( today.getDay() );
    const lastUpdateWeekday = strToDate(lastPossibleDeven).getDay();
    
    shouldUpdate = daysPassed >= UPDATE_INTERVAL && !(
      // no update needed if: we are in weekend but ONLY if last time we updated was on last day (wednesday) of THIS week
      inWeekend &&
      lastUpdateWeekday !== 3 && // not wednesday
      daysPassed <= 3            // and wednesday of this week
    );
  } else {
    // first time (never updated before)
    shouldUpdate = true;
  }
  
  if (shouldUpdate) {
    let error;
    const res = await rq.LastPossibleDeven().catch(err => error = err);
    if (error)                        throw new Error('Failed request: ',      'LastPossibleDeven: ', `(${error})`);
    if ( !/^\d{8};\d{8}$/.test(res) ) throw new Error('Invalid server response: LastPossibleDeven');
    lastPossibleDeven = res.split(';')[0] || res.split(';')[1];
    localStorage.setItem('tse.lastPossibleDeven', lastPossibleDeven);
  }
  
  return +lastPossibleDeven;
}

async function updateInstruments() {
  const lastUpdate = localStorage.getItem('tse.lastInstrumentUpdate');
  let lastDeven;
  let lastId;
  let currentInstruments;
  let currentShares;
  
  if (!lastUpdate) {
    lastDeven = 0;
    lastId = 0;
  } else {
    currentInstruments = parseInstruments();
    currentShares      = parseShares();
    const insDevens = Object.keys(currentInstruments).map( k => parseInt(currentInstruments[k].match(/\b\d{8}\b/)[0]) );
    const shareIds = Object.keys(currentShares).map( k => parseInt(currentShares[k].split(',',1)[0]) );
    lastDeven = Math.max(...insDevens);
    lastId    = Math.max(...shareIds);
  }
  
  const lastPossibleDeven = await getLastPossibleDeven();
  if (dayDiff(''+lastDeven, ''+lastPossibleDeven) < UPDATE_INTERVAL) return;
  
  let error;
  const res = await rq.InstrumentAndShare(lastDeven, lastId).catch(err => error = err);
  if (error) { warn('Failed request: InstrumentAndShare', `(${error})`); return; } // TODO: better handling
  
  const splitted  = res.split('@');
  let instruments = splitted[0];
  let shares      = splitted[1];
  
  if (instruments === '*') warn('Cannot update during trading session hours.');
  if (instruments === '')  warn('Already updated: ', 'Instruments');
  if (shares === '')       warn('Already updated: ', 'Shares');
  
  if (instruments !== '' && instruments !== '*') {
    if (currentInstruments && Object.keys(currentInstruments).length) {
      instruments.split(';').forEach(i => currentInstruments[ i.match(/^\d+\b/)[0] ] = i);
      instruments = Object.keys(currentInstruments).map(k => currentInstruments[k]).join(';');
    }
    localStorage.setItem('tse.instruments', instruments);
  }
  
  if (shares !== '') {
    if (currentShares && currentShares.length) {
      shares.split(';').forEach(i => currentShares[ i.split(',',1)[0] ] = i);
      shares = Object.keys(currentShares).map(k => currentShares[k]).join(';');
    }
    localStorage.setItem('tse.shares', shares);
  }
  
  if ((instruments !== '' && instruments !== '*') || shares !== '') {
    localStorage.setItem('tse.lastInstrumentUpdate', dateToStr(new Date()));
  }
}

async function updatePricesRequester(chunk=[]) {
  let res;
  const mkRes = (result, error, reqError) => ({ result, error, reqError });
  
  const insCodes = chunk.map(i => i.uriSegs.join(',')).join(';');
  
  let error;
  const resp = await rq.ClosingPrices(insCodes).catch(r => error = r);
  if (error)                        { res = mkRes(chunk, 'Failed request: ClosingPrices', error);   return res; }
  if ( !/^[\d.,;@-]*$/.test(resp) ) { res = mkRes(chunk, 'Invalid server response: ClosingPrices'); return res; }
  if (resp === '')                  { res = mkRes(chunk, 'Unknown Error.');                         return res; }
  
  const o = {};
  resp.split('@').forEach((v,i)=> o[chunk[i].insCode] = v);
  res = mkRes(o)
  
  return res;
}
async function updatePricesRetrier(updateNeeded={}, count=0, result={}) {
  const keys = Object.keys(updateNeeded);
  const chunks = splitArr(keys, PRICES_UPDATE_CHUNK).map( i => i.map(k=> updateNeeded[k]) );
  
  const proms = [];
  for (const chunk of chunks) {
    proms.push( updatePricesRequester(chunk) );
    await sleep(PRICES_UPDATE_CHUNK_DELAY);
  }
  const settled = await Promise.allSettled(proms);
  const res = settled.map(i => i.value);
  
  const fails = res.filter(i => i.error).reduce((a,{result:c})=> c.forEach(i=> a[i.insCode] = i) || a, {});
  const succs = res.filter(i => !i.error).reduce((a,{result:c}) => Object.keys(c).forEach(k=> a[k] = c[k]) || a, {});
  
  result.succs = {...result.succs, ...succs};
  result.fails = {...fails};
  
  count++;
  if (count > PRICES_UPDATE_RETRY_COUNT) return result;
  
  if (Object.keys(fails).length) {
    result = await new Promise(async (resolve, reject) => {
      await sleep(PRICES_UPDATE_RETRY_DELAY);
      const r = await updatePricesRetrier(fails, count, result);
      resolve(r);
    });
  }
  
  return result;
}
async function updatePrices(instruments=[], startDeven) {
  if (!instruments.length) return;
  const lastPossibleDeven = await getLastPossibleDeven();
  
  const updateNeeded = {}; // redundant insCode needed due to splitArr & updatePricesRequester
  for (const instrument of instruments) {
    const insCode = instrument.InsCode;
    const market = instrument.YMarNSC === 'NO' ? 0 : 1;
    const insData = storedPrices[insCode];
    if (!insData) { // doesn't have data
      updateNeeded[insCode] = {
        uriSegs: [insCode, startDeven, market],
        insCode
      };
    } else { // has data
      const rows = insData.split(';');
      const lastRow = new ClosingPrice( rows[rows.length-1] );
      const lastRowDEven = +lastRow.DEven;
      if (dayDiff(''+lastRowDEven, ''+lastPossibleDeven) >= UPDATE_INTERVAL) { // but outdated
        updateNeeded[insCode] = {
          uriSegs: [insCode, lastRowDEven, market],
          insCode,
          oldContent: insData
        };
      }
    }
  }
  let res = { succs: {}, fails: {} };
  if (!Object.keys(updateNeeded).length) return res;
  
  const { succs, fails } = await updatePricesRetrier(updateNeeded);
  
  const suckeys = Object.keys(succs);
  for (const k of suckeys) {
    const { oldContent } = updateNeeded[k];
    const newContent = succs[k];
    
    let content = oldContent || '';
    if (newContent) {
      content = oldContent ? oldContent+';'+newContent : newContent;
    }
    
    storedPrices[k] = content;
  }
  
  let str = '';
  const keys = Object.keys(storedPrices);
  for (let i=0, n=keys.length; i<n; i++) str += storedPrices[ keys[i] ] + '@';
  str = str.slice(0, -1);
  
  await localforage.setItem('tse.prices', str);
  
  return res;
}

async function getInstruments(struct=true, arr=true, structKey='InsCode') {
  await updateInstruments();
  return parseInstruments(struct, arr, structKey);
}

async function getPrices(symbols=[], settings={}) {
  if (!symbols.length) return;
  
  await updateInstruments();
  const instruments = parseInstruments(true, undefined, 'Symbol');
  const selection = symbols.map(i => instruments[i]);
  const notFounds = symbols.filter((v,i) => !selection[i]);
  if (notFounds.length) { console.error('Incorrect symbol names:', notFounds); return; }
  
  settings = {...defaultSettings, ...settings};
  const { adjustPrices, startDate, daysWithoutTrade } = settings;
  
  await parseStoredPrices();
  
  const { succs, fails } = await updatePrices(selection, startDate);
  const [ slen, flen ] = [succs, fails].map(i => Object.keys(i).length);
  
  if (flen) {
    warn(`Incomplete Price Update:  Failed: ${flen} - Updated: ${slen} (after ${PRICES_UPDATE_RETRY_COUNT} retries)`);
    const failKeys = Object.keys(fails);
    selection.forEach((v,i,a) => failKeys.includes(v.InsCode) ? a[i] = undefined : 0);
  }
  
  const prices = {};
  for (const i of selection) {
    if (!i) continue;
    const insCode = i.InsCode;
    const strPrices = storedPrices[insCode];
    if (!strPrices) continue; // throw new Error('Unkown Error');
    prices[insCode] = strPrices.split(';').map(i => new ClosingPrice(i));
  }
  
  const shares = parseShares(true, true);
  const columns = settings.columns.map(i => {
    const row = !Array.isArray(i) ? [i] : i;
    const column = new Column(row);
    const finalHeader = column.header || column.name;
    return { ...column, header: finalHeader };
  });
  
  const res = selection.map(instrument => {
    if (!instrument) return;
    const res = {};
    columns.forEach(col => res[col.header] = []);
    
    const insCode = instrument.InsCode;
    if (!prices[insCode]) return res;
    const cond = adjustPrices;
    const closingPrices = cond === 1 || cond === 2
      ? adjust(cond, prices[insCode], shares, insCode)
      : prices[insCode];
    
    for (const closingPrice of closingPrices) {
      if ( Big(closingPrice.DEven).lt(startDate) ) continue;
      if ( Big(closingPrice.ZTotTran).eq(0) && !daysWithoutTrade ) continue;
      
      for (const {header, name} of columns) {
        const cell = getCell(name, instrument, closingPrice);
        res[header].push(/^\d+(\.?\d+)?$/.test(cell) ? parseFloat(cell) : cell);
      }
    }
    
    return res;
  });
  
  return res;
}

window.tse = {
  getInstruments,
  getPrices,
  
  get API_URL() { return API_URL; },
  set API_URL(v) {
    if (typeof v !== 'string') return;
    let bad;
    try { new URL(v); } catch (e) { bad = true; throw e; }
    if (!bad) API_URL = v;
  },
  
  get UPDATE_INTERVAL() { return UPDATE_INTERVAL; },
  set UPDATE_INTERVAL(v) { if (Number.isInteger(v)) UPDATE_INTERVAL = v; },
  
  get PRICES_UPDATE_CHUNK() { return PRICES_UPDATE_CHUNK; },
  set PRICES_UPDATE_CHUNK(v) { if (Number.isInteger(v) && v > 0 && v < 60) PRICES_UPDATE_CHUNK = v; },
  
  get PRICES_UPDATE_CHUNK_DELAY() { return PRICES_UPDATE_CHUNK_DELAY; },
  set PRICES_UPDATE_CHUNK_DELAY(v) { if (Number.isInteger(v)) PRICES_UPDATE_CHUNK_DELAY = v; },
  
  get PRICES_UPDATE_RETRY_COUNT() { return PRICES_UPDATE_RETRY_COUNT; },
  set PRICES_UPDATE_RETRY_COUNT(v) { if (Number.isInteger(v)) PRICES_UPDATE_RETRY_COUNT = v; },
  
  get PRICES_UPDATE_RETRY_DELAY() { return PRICES_UPDATE_RETRY_DELAY; },
  set PRICES_UPDATE_RETRY_DELAY(v) { if (Number.isInteger(v)) PRICES_UPDATE_RETRY_DELAY = v; },
  
  get columnList() {
    return [...Array(15)].map((v,i) => ({name: cols[i], fname: colsFa[i]}));
  }
};
})();