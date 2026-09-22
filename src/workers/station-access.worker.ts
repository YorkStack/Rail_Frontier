import {ContentRegistry} from '../content/registry.js';
import {previewStationAccess,type StationAccessRequest,type StationAccessPreview} from '../application/station-access-preview.js';
const context=self as unknown as {onmessage:((event:MessageEvent<StationAccessRequest>)=>void)|null;postMessage(value:{result:StationAccessPreview}|{requestId:number;error:string}):void};
context.onmessage=event=>{const request=event.data;try{const content=new ContentRegistry().resolve(request.state);context.postMessage({result:previewStationAccess(request,content.worldGenerator.generate(request.state.world))});}catch(error){context.postMessage({requestId:request.requestId,error:error instanceof Error?error.message:String(error)});}};
