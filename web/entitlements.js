(function(global){'use strict';
/** Permanent case ownership boundary. No purchase flow exists in this build.
 * A future Bazaar adapter must verify ownership before reporting true and must
 * cache a verified entitlement for offline replay. Never trust a UI/local flag.
 */
class CaseOwnership {
 constructor(provider){this.provider=provider||null;}
 canOpen(caseData){if(caseData.entitlement==='free')return true;return Boolean(this.provider&&this.provider.hasVerifiedPermanentOwnership(caseData.id)===true);}
 async purchase(caseData){if(this.canOpen(caseData))return {owned:true};if(!this.provider)return {owned:false,reason:'purchases_not_available'};return this.provider.purchasePermanent(caseData.id,caseData.productId);}
 async restore(){if(!this.provider)return {restored:false,reason:'purchases_not_available'};return this.provider.restoreVerifiedOwnership();}
}
if(typeof module!=='undefined'&&module.exports)module.exports={CaseOwnership};global.CaseOwnership=CaseOwnership;
})(typeof globalThis!=='undefined'?globalThis:this);
