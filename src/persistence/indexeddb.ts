import type { SaveStore } from '../application/ports.js';
interface Slot { id:string;name:string;modifiedAt:string;json:string }
const storageError=(error:unknown):Error=>{
  if(error instanceof DOMException&&error.name==='QuotaExceededError')return new Error('Browser storage is full. Export or delete a saved company, then try again.');
  if(error instanceof DOMException&&(error.name==='SecurityError'||error.name==='InvalidStateError'))return new Error('Browser storage is unavailable. Check private-browsing and site-storage settings.');
  return error instanceof Error?error:new Error('Browser storage failed');
};
export class IndexedDbSaveStore implements SaveStore {
  private database:Promise<IDBDatabase>;
  constructor(name='rail-frontier') {
    this.database=new Promise((resolve,reject)=>{
      const request=indexedDB.open(name,1);
      request.onupgradeneeded=()=>request.result.createObjectStore('slots',{keyPath:'id'});
      request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result);};
      request.onerror=()=>reject(storageError(request.error));
      request.onblocked=()=>reject(new Error('Close another Rail Frontier tab to upgrade save storage.'));
    });
  }
  private async transaction<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T> {
    const db=await this.database;
    return new Promise((resolve,reject)=>{
      const transaction=db.transaction('slots',mode),request=operation(transaction.objectStore('slots'));
      transaction.oncomplete=()=>resolve(request.result);
      transaction.onerror=()=>reject(storageError(transaction.error??request.error));
      transaction.onabort=()=>reject(storageError(transaction.error??new Error('Save transaction aborted')));
    });
  }
  async list():Promise<{id:string;name:string;modifiedAt:string}[]> {
    const values:Slot[]=await this.transaction('readonly',store=>store.getAll());
    return values.map(({id,name,modifiedAt})=>({id,name,modifiedAt})).sort((a,b)=>b.modifiedAt.localeCompare(a.modifiedAt));
  }
  async write(id:string,name:string,json:string):Promise<void> {
    await this.transaction('readwrite',store=>store.put({id,name,json,modifiedAt:new Date().toISOString()} satisfies Slot));
  }
  async read(id:string):Promise<string> {
    const value:Slot|undefined=await this.transaction('readonly',store=>store.get(id));
    if(!value)throw new Error('Save slot does not exist');return value.json;
  }
  async remove(id:string):Promise<void> {await this.transaction('readwrite',store=>store.delete(id));}
  async estimate():Promise<{usageBytes:number|null;quotaBytes:number|null}> {
    if(!navigator.storage?.estimate)return {usageBytes:null,quotaBytes:null};
    const {usage,quota}=await navigator.storage.estimate();return {usageBytes:usage??null,quotaBytes:quota??null};
  }
  async close():Promise<void> {(await this.database).close();}
}
