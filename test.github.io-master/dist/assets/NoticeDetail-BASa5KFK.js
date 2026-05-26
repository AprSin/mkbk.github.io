import{_ as c,o as l,c as r,a as t,t as a,F as h,r as u,j as p,g as w,d as m,u as v}from"./index-DH_Yjx2O.js";const g={name:"NoticeDetail",setup(){return{userStore:v()}},data(){return{pendingDownload:null,notice:{id:"1",title:"商丘市梁园区人民政府 关于印发《商丘市梁园区农村产权交易市场体系建设方案》《商丘市梁园区农村产权流转交易运营管理办法（试行）》的通知",content:`为规范农村产权交易行为，保障交易双方合法权益，促进农村产权流转交易市场健康发展，特制定本方案和管理办法。

一、指导思想
以习近平新时代中国特色社会主义思想为指导，全面贯彻党的二十大精神，坚持农业农村优先发展，深化农村改革，健全农村产权交易市场体系，促进农村资源要素有序流动，为乡村振兴提供有力支撑。

二、工作目标
到2025年，建立健全覆盖全区的农村产权交易市场体系，实现农村产权交易规范化、制度化、信息化，提高农村资源配置效率，促进农村集体经济发展。

三、主要任务
1. 建立健全农村产权交易市场体系
2. 规范农村产权交易行为
3. 加强农村产权交易平台建设
4. 强化农村产权交易监督管理

四、保障措施
1. 加强组织领导
2. 加大政策支持
3. 强化宣传培训
4. 严格监督考核

本方案和管理办法自发布之日起施行。`,date:"2024-06-01",organization:"商丘市梁园区人民政府",attachments:[{name:"商丘市梁园区农村产权交易市场体系建设方案.pdf",url:"#"},{name:"商丘市梁园区农村产权流转交易运营管理办法（试行）.pdf",url:"#"}]}}},watch:{"userStore.isLoggedIn":{handler(n){n&&this.pendingDownload&&(this.executeDownload(this.pendingDownload),this.pendingDownload=null)}}},methods:{handleDownload(n){if(!this.userStore.isLoggedIn){this.pendingDownload=n,this.$root.showLoginDialog=!0;return}this.executeDownload(n)},executeDownload(n){alert(`开始下载: ${n.name}`),setTimeout(()=>{alert(`下载成功！${n.name} 已保存到您的设备。`)},1e3)},shareNotice(){alert("通知链接已复制到剪贴板！")},printNotice(){window.print()}}},_={class:"notice-detail-container"},f={class:"notice-detail"},x={class:"notice-header"},y={class:"notice-meta"},k={class:"meta-item"},D={class:"meta-item"},N={class:"notice-content"},b={key:0,class:"notice-attachments"},C={class:"attachment-list"},S=["onClick"],B={class:"notice-actions"};function V(n,e,L,j,o,i){return l(),r("div",_,[e[5]||(e[5]=t("h1",null,"通知详情",-1)),t("div",f,[t("div",x,[t("h2",null,a(o.notice.title),1),t("div",y,[t("span",k,"发布日期: "+a(o.notice.date),1),t("span",D,"发布单位: "+a(o.notice.organization),1)])]),t("div",N,[t("p",null,a(o.notice.content),1),o.notice.attachments&&o.notice.attachments.length>0?(l(),r("div",b,[e[4]||(e[4]=t("h3",null,"相关附件",-1)),t("div",C,[(l(!0),r(h,null,u(o.notice.attachments,(s,d)=>(l(),r("div",{key:d,class:"attachment-item"},[e[3]||(e[3]=p('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-19ef4a4a><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-v-19ef4a4a></path><polyline points="14,2 14,8 20,8" data-v-19ef4a4a></polyline><line x1="16" y1="13" x2="8" y2="13" data-v-19ef4a4a></line><line x1="16" y1="17" x2="8" y2="17" data-v-19ef4a4a></line><polyline points="10,9 9,9 8,9" data-v-19ef4a4a></polyline></svg>',1)),t("span",null,a(s.name),1),t("button",{class:"btn btn-secondary",onClick:z=>i.handleDownload(s)},[...e[2]||(e[2]=[t("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},[t("path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}),t("polyline",{points:"7,10 12,15 17,10"}),t("line",{x1:"12",y1:"15",x2:"12",y2:"3"})],-1),w(" 下载 ",-1)])],8,S)]))),128))])])):m("",!0)]),t("div",B,[t("button",{class:"btn btn-secondary",onClick:e[0]||(e[0]=(...s)=>i.shareNotice&&i.shareNotice(...s))},"分享通知"),t("button",{class:"btn btn-secondary",onClick:e[1]||(e[1]=(...s)=>i.printNotice&&i.printNotice(...s))},"打印通知")])])])}const I=c(g,[["render",V],["__scopeId","data-v-19ef4a4a"]]);export{I as default};
