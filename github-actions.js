/* Single-owner GitHub Actions control. Token lives in memory only. */
window.moneycutGitHub = (() => {
 const repo='sanbital/moneycut-studio',workflow='moneycut.yml';
 let token='';
 async function request(path,method='GET',body){
  if(!token)throw Error('연결 및 설정에서 GitHub 실행 토큰을 입력하세요. 이 탭에서만 사용합니다.');
  let r;try{r=await fetch('https://api.github.com/repos/'+repo+path,{method,signal:AbortSignal.timeout(30000),headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined})}catch{throw Error('GitHub 연결에 실패했습니다. 네트워크를 확인하세요.')}
  if(!r.ok)throw Error(r.status===401?'GitHub 토큰이 올바르지 않거나 만료됐습니다.':r.status===403||r.status===404?'moneycut-studio 저장소의 Actions 읽기·쓰기 권한을 확인하세요.':'GitHub 작업 요청 실패 ('+r.status+')');
  return r.status===204?null:r.json();
 }
 return {
  async connect(value){token=value.trim();try{await request('/actions/workflows/'+workflow)}catch(e){token='';throw e}},
  async runs(){return (await request('/actions/workflows/'+workflow+'/runs?per_page=30')).workflow_runs},
  async create(body){const id='제작-'+crypto.randomUUID().slice(0,8);await request('/actions/workflows/'+workflow+'/dispatches','POST',{ref:'main',inputs:{mode:'produce',request_id:id,request:JSON.stringify(body)}});return {id}},
  async resume(run){await request('/actions/workflows/'+workflow+'/dispatches','POST',{ref:'main',inputs:{mode:'produce',request_id:'재개-'+run,request:JSON.stringify({query:'이전 작업 재개'}),resume_run:String(run)}})},
  disconnect(){token=''}
 };
})();
