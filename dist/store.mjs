const DB_NAME="dsa-now-v2", STORE="state";
export async function openStore() {
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB_NAME,1);
    r.onupgradeneeded=()=>r.result.createObjectStore(STORE);
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
    r.onblocked=()=>reject(new Error("Close another DSA Now tab and reload to finish opening storage."));
  });
}
export async function readState(db) {
  return new Promise((resolve,reject)=>{
    const t=db.transaction(STORE,"readonly"),r=t.objectStore(STORE).get("profile");
    r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);
  });
}
export async function writeState(db,next,expectedRevision) {
  return new Promise((resolve,reject)=>{
    const t=db.transaction(STORE,"readwrite"),store=t.objectStore(STORE),r=store.get("profile");
    let result, failure;
    r.onsuccess=()=>{
      if((r.result?.revision||0)!==expectedRevision){failure=new Error("Another tab changed your progress. Reload this tab before saving again.");t.abort();return}
      result={...next,revision:expectedRevision+1};store.put(result,"profile");
    };
    r.onerror=()=>{failure=r.error};
    t.oncomplete=()=>resolve(result);
    t.onabort=t.onerror=()=>reject(failure||t.error||new Error("Progress could not be saved."));
  });
}
