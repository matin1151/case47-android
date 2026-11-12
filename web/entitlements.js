(function(global){'use strict';
/** Permanent case ownership boundary. No purchase flow exists in this build.
 * A future Bazaar adapter must verify ownership before reporting true and must
 * cache a verified entitlement for offline replay. Never trust a UI/local flag.
 */
class BazaarOwnership {
 hasVerifiedPermanentOwnership(id){try{return !!global.KavianBazaar&&global.KavianBazaar.hasOwnership(id)===true;}catch(e){return false;}}
 request(action,product){if(!global.KavianBazaar)return Promise.resolve({owned:false,message:'خرید در نسخه اندروید و از طریق بازار انجام می‌شود.'});return new Promise(resolve=>{const id='req-'+Date.now()+'-'+Math.random().toString(36).slice(2);let timer;const handler=event=>{if(event.detail.id!==id)return;clearTimeout(timer);global.removeEventListener('kavian-billing',handler);resolve(event.detail);};global.addEventListener('kavian-billing',handler);timer=setTimeout(()=>{global.removeEventListener('kavian-billing',handler);resolve({owned:false,message:'پاسخ خرید نرسید؛ برای بررسی نتیجه، بازیابی خرید را بزن.'});},180000);global.KavianBazaar.request(id,action,product||'');});}
 purchasePermanent(id,product){return this.request('purchase',product);}
 restoreVerifiedOwnership(){return this.request('restore');}
}
global.BazaarOwnership=BazaarOwnership;
class CaseOwnership {
 constructor(provider){this.provider=provider||null;}
 canOpen(caseData){if(caseData.entitlement==='free')return true;return Boolean(this.provider&&this.provider.hasVerifiedPermanentOwnership(caseData.id)===true);}
 async purchase(caseData){if(this.canOpen(caseData))return {owned:true};if(!this.provider)return {owned:false,reason:'purchases_not_available'};return this.provider.purchasePermanent(caseData.id,caseData.productId);}
 async restore(){if(!this.provider)return {restored:false,reason:'purchases_not_available'};return this.provider.restoreVerifiedOwnership();}
}
if(typeof module!=='undefined'&&module.exports)module.exports={CaseOwnership};global.CaseOwnership=CaseOwnership;
})(typeof globalThis!=='undefined'?globalThis:this);
