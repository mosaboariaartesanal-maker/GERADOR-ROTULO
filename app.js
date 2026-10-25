const STORAGE_KEY = "atelie_rotulos_v1";
const fields = ["nome","tipo","peso","descricao","destaque","composicao","modo","atencao","fabricacao","validade","telefone","instagram","email","endereco","qr","marca","logoUrl"];
let labels = loadLabels();
let toastTimer;
const $ = id => document.getElementById(id);

function loadLabels(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch(e){return []}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(labels));renderRepository();refreshPrintSelect()}
function uid(){return "rotulo_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7)}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function value(id){return $(id)&&$(id).value?$(id).value.trim():""}
function notify(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}

function switchTab(tab){
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.toggle("active",p.id==="tab-"+tab));
  const titles={cadastro:"Cadastro de rótulo",repositorio:"Repositório de rótulos",gerados:"Rótulos gerados",backup:"Importar / exportar"};
  $("page-title").textContent=titles[tab];
  if(tab==="gerados")updatePreview();
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));

function resetForm(){ 
  $("label-form").reset();
  $("label-id").value="";
  $("tipo").value="Sabonete artesanal";
  $("peso").value="100g";
  if($("logoUrl")) $("logoUrl").value="";
  if($("logo-file")) $("logo-file").value="";
  if($("logo-preview-wrap")) $("logo-preview-wrap").style.display="none";
  $("page-title").textContent="Cadastro de rótulo"; 
}

$("new-label").addEventListener("click",()=>{resetForm();switchTab("cadastro");window.scrollTo({top:0,behavior:"smooth"})});
$("clear-form").addEventListener("click",resetForm);

if($("logo-file")){
  $("logo-file").addEventListener("change", e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(evt){
      $("logoUrl").value = evt.target.result;
      if($("logo-preview-img")){
        $("logo-preview-img").src = evt.target.result;
        $("logo-preview-wrap").style.display = "flex";
      }
      notify("Logo da marca carregada com sucesso!");
    };
    reader.readAsDataURL(file);
  });
}

if($("remove-logo-btn")){
  $("remove-logo-btn").addEventListener("click", () => {
    $("logoUrl").value = "";
    if($("logo-file")) $("logo-file").value = "";
    if($("logo-preview-wrap")) $("logo-preview-wrap").style.display = "none";
    notify("Logo removida. O sistema usará a padrão.");
  });
}

$("label-form").addEventListener("submit",e=>{
  e.preventDefault();
  const data={};
  fields.forEach(f=>data[f]=value(f));
  if(!data.nome||!data.composicao||!data.modo){notify("Preencha nome, composição e modo de usar.");return}
  const id=$("label-id").value;
  const now=new Date().toISOString();
  if(id){
    const i=labels.findIndex(x=>x.id===id);
    if(i>=0)labels[i]={...labels[i],...data,updatedAt:now};
  }else labels.unshift({id:uid(),...data,createdAt:now,updatedAt:now});
  persist();
  resetForm();
  notify(id?"Cadastro atualizado com sucesso.":"Rótulo salvo no repositório.");
  switchTab("repositorio");
});

function renderRepository(){
  const grid=$("repo-grid");let list=[...labels];
  const q=$("repo-search").value.toLowerCase().trim();
  list=list.filter(x=>(x.nome+" "+x.marca+" "+x.destaque).toLowerCase().includes(q));
  const sort=$("repo-sort").value;
  if(sort==="az")list.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
  if(sort==="za")list.sort((a,b)=>b.nome.localeCompare(a.nome,"pt-BR"));
  $("repo-count").innerHTML=String(labels.length).padStart(2,"0")+" <span>rótulos</span>";
  if(!list.length){
    grid.innerHTML=`<div class="empty-state"><strong>${labels.length?"Nenhum resultado encontrado":"Seu repositório está vazio"}</strong>${labels.length?"Tente outro termo de busca.":"Cadastre seu primeiro sabonete para começar a gerar PDFs."}<br><br><button class="button primary" onclick="switchTab('cadastro')">＋ Cadastrar rótulo</button></div>`;
    return;
  }
  grid.innerHTML=list.map(x=>`<article class="label-card"><div class="mini-label"><h4>${escapeHtml(x.nome)}</h4><div class="mini-sub">${escapeHtml(x.tipo||"Sabonete artesanal")}</div><p>${escapeHtml(x.descricao||x.destaque||x.composicao||"Rótulo artesanal")}</p></div><div class="card-title">${escapeHtml(x.nome)}</div><div class="card-meta">${escapeHtml(x.peso||"Peso não informado")} · ${escapeHtml(x.marca||"Marca não informada")}</div><div class="card-actions"><button class="button ghost" onclick="editLabel('${x.id}')">Editar</button><button class="button ghost" onclick="sendToPrint('${x.id}')">Gerar PDF</button><button class="button ghost" onclick="duplicateLabel('${x.id}')">Duplicar</button><button class="button ghost" onclick="deleteLabel('${x.id}')">Excluir</button></div></article>`).join("");
}

$("repo-search").addEventListener("input",renderRepository);
$("repo-sort").addEventListener("change",renderRepository);

function editLabel(id){
  const x=labels.find(x=>x.id===id);if(!x)return;
  fields.forEach(f=>{ if($(f)) $(f).value=x[f]||""; });
  if(x.logoUrl && $("logo-preview-wrap")){
    $("logo-preview-img").src = x.logoUrl;
    $("logo-preview-wrap").style.display = "flex";
  } else if($("logo-preview-wrap")) {
    $("logo-preview-wrap").style.display = "none";
  }
  $("label-id").value=x.id;
  switchTab("cadastro");
  $("page-title").textContent="Editar rótulo";
  window.scrollTo({top:0,behavior:"smooth"});
}

function duplicateLabel(id){
  const x=labels.find(x=>x.id===id);if(!x)return;
  const copy={...x,id:uid(),nome:x.nome+" (cópia)",createdAt:new Date().toISOString()};
  labels.unshift(copy);persist();
  notify("Cópia criada no repositório.");
}

function deleteLabel(id){
  const x=labels.find(x=>x.id===id);if(!x)return;
  if(!confirm(`Excluir o cadastro "${x.nome}"? Esta ação não pode ser desfeita.`))return;
  labels=labels.filter(x=>x.id!==id);persist();
  notify("Cadastro excluído.");
}

function refreshPrintSelect(selected=""){
  const select=$("print-select");
  const current=selected||select.value;
  select.innerHTML='<option value="">Selecione um sabonete...</option>'+labels.map(x=>`<option value="${x.id}">${escapeHtml(x.nome)}</option>`).join("");
  if(labels.some(x=>x.id===current))select.value=current;
  updatePreview();
}

function sendToPrint(id){
  switchTab("gerados");
  refreshPrintSelect(id);
  $("print-select").value=id;
  updatePreview();
  window.scrollTo({top:0,behavior:"smooth"});
}

$("print-select").addEventListener("change",updatePreview);
$("label-width").addEventListener("input",updatePreview);
$("label-height").addEventListener("input",updatePreview);

function getDimensions(){
  const width=Number($("label-width").value)||6;
  const height=Number($("label-height").value)||3.5;
  return {width:Math.min(20,Math.max(2,width)),height:Math.min(20,Math.max(2,height))};
}

function updateDimensionUI(){
  const {width,height}=getDimensions();
  const fmt=n=>String(Number(n.toFixed(2))).replace(".",",");
  $("dimension-summary").textContent=`${fmt(width)} × ${fmt(height)} cm`;
  $("preview-size-tag").textContent=`${fmt(width)} × ${fmt(height)} cm`;
  const p=$("label-preview");
  p.style.aspectRatio=`${width}/${height}`;
}

function updatePreview(){
  updateDimensionUI();
  const x=labels.find(x=>x.id===$("print-select").value);
  const p=$("label-preview");
  if(!x){p.className="label-preview empty-preview";p.textContent="Selecione um rótulo para visualizar";return}
  p.className="label-preview";

  const logoToUse = x.logoUrl || "";

  p.innerHTML=`
  <div class="preview-left">
    ${logoToUse ? `<div class="preview-logo-wrap"><img src="${logoToUse}" class="preview-logo-img" alt="Logo"></div>` : ''}
    <h2>${escapeHtml(x.nome)}</h2>
    <div class="preview-type">${escapeHtml(x.tipo||"SABONETE ARTESANAL")}</div>
    <p class="preview-desc" style="text-align: justify; text-justify: inter-word;">${escapeHtml(x.descricao||"Cuidado artesanal para a pele, todos os dias.")}</p>
    ${x.destaque?`<div class="preview-highlight-center">${escapeHtml(x.destaque.toUpperCase().replace(/^COM\s+/i,''))}</div>`:''}
    <div class="preview-weight">${escapeHtml(x.peso||"100g")}</div>
  </div>
  <div class="preview-right">
    <div class="preview-sections-wrap">
      <div class="preview-section"><b>COMPOSIÇÃO</b><p style="text-align: justify; text-justify: inter-word;">${escapeHtml(x.composicao||"")}</p></div>
      <div class="preview-section"><b>MODO DE USAR</b><p style="text-align: justify; text-justify: inter-word;">${escapeHtml(x.modo||"")}</p></div>
      ${x.atencao?`<div class="preview-section"><b>ATENÇÃO</b><p style="text-align: justify; text-justify: inter-word;">${escapeHtml(x.atencao)}</p></div>`:''}
    </div>
    <div class="preview-bottom">
      <div class="preview-contact" style="text-align: justify; text-justify: inter-word;">
        ${escapeHtml([x.telefone,x.instagram||"@mosaboaria",x.email].filter(Boolean).join(" · "))}
        <div class="preview-address-line">${escapeHtml([x.marca||"Mô Saboaria",x.endereco||"Contagem/MG"].filter(Boolean).join(" · "))}</div>
        <div class="preview-dates-line"><strong>${escapeHtml([x.fabricacao?"FAB: "+x.fabricacao:"",x.validade?"VAL: "+x.validade:""].filter(Boolean).join(" · "))}</strong></div>
      </div>
      <div class="preview-qr-wrap"><div id="preview-qr"></div><small>INSTAGRAM</small></div>
    </div>
  </div>`;
  renderPreviewQR();
}

async function renderPreviewQR(){
  const el=$("preview-qr");if(!el)return;
  el.innerHTML="";el.className="";
  if(!window.QRCode)await ensureQRCodeLibrary();
  if(window.QRCode){
    new QRCode(el,{text:"https://www.instagram.com/mosaboaria/",width:128,height:128,colorDark:"#000000",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});
  } else {el.textContent="QR";el.className="qr-fallback";}
}

async function ensureQRCodeLibrary(){
  if(window.QRCode)return true;
  const urls=["https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js","https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"];
  for(const src of urls){
    try{
      await new Promise((resolve,reject)=>{
        const script=document.createElement("script");
        script.src=src;
        script.onload=resolve;
        script.onerror=()=>{script.remove();reject(new Error("Falha ao carregar QR Code"))};
        document.head.appendChild(script);
      });
      if(window.QRCode)return true;
    }catch(e){}
  }
  return false;
}

async function getInstagramQRDataURL(){
  const ready=await ensureQRCodeLibrary();
  if(!ready)return null;
  const host=document.createElement("div");
  host.style.cssText="position:fixed;left:-10000px;top:0;width:256px;height:256px;background:#fff";
  document.body.appendChild(host);
  try{
    new QRCode(host,{text:"https://www.instagram.com/mosaboaria/",width:256,height:256,colorDark:"#000000",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});
    await new Promise(r=>setTimeout(r,100));
    const canvas=host.querySelector("canvas");
    if(canvas)return canvas.toDataURL("image/png");
    const img=host.querySelector("img");
    if(img&&img.src.startsWith("data:"))return img.src;
    return null;
  }finally{host.remove()}
}

function drawLabel(doc, x, y, w, h, d, qrData){
  const green=[18,61,42], black=[0,0,0], gold=[185,145,70], pale=[240,245,235];
  
  const margin = 1.0;
  const px = x + margin;
  const py = y + margin;
  const pw = w - (margin * 2);
  const ph = h - (margin * 2);

  doc.setFillColor(255,255,255);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 1, 1, "FD");

  doc.setDrawColor(215,195,140);
  doc.setLineWidth(0.15);
  doc.roundedRect(x + 0.5, y + 0.5, w - 1.0, h - 1.0, 0.7, 0.7, "S");

  const leftW = pw * 0.44;
  const rightX = px + leftW + 1.0;
  const rightW = pw - leftW - 1.0;

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.2);
  doc.line(px + leftW + 0.5, py + 0.8, px + leftW + 0.5, py + ph - 0.8);

  // ==================== COLUNA ESQUERDA ====================
  let curY = py + 0.6;

  if(d.logoUrl){
    const logoW = Math.min(14, leftW * 0.75);
    const logoH = logoW * 0.7;
    const logoX = px + (leftW - logoW)/2;
    try {
      doc.addImage(d.logoUrl, "PNG", logoX, curY, logoW, logoH);
      curY += logoH + 0.4;
    } catch(e) {
      curY += 0.8;
    }
  } else {
    curY += 1.0;
  }

  doc.setTextColor(...green);
  doc.setFont("times", "bold");
  let titleFontSize = 8.5;
  doc.setFontSize(titleFontSize);
  let titleLines = doc.splitTextToSize(d.nome || "Elixir de Calmaria", leftW);
  if (titleLines.length > 2) {
    titleFontSize = 7.0;
    doc.setFontSize(titleFontSize);
    titleLines = doc.splitTextToSize(d.nome || "Elixir de Calmaria", leftW).slice(0, 2);
  }
  doc.text(titleLines, px + leftW/2, curY, { align: "center", lineHeightFactor: 0.95 });
  curY += (titleLines.length * (titleFontSize * 0.35)) + 0.8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.1);
  doc.setTextColor(...green);
  const typeText = (d.tipo || "SABONETE ARTESANAL").toUpperCase();
  const typeLines = doc.splitTextToSize(typeText, leftW);
  doc.text(typeLines, px + leftW/2, curY, { align: "center", lineHeightFactor: 1.0 });
  curY += (typeLines.length * 1.5) + 0.8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.5);
  doc.setTextColor(...black);
  const descText = d.descricao || "Uma combinação de ingredientes naturais...";
  const descLines = doc.splitTextToSize(descText, leftW);
  
  descLines.forEach((line, index) => {
    if (curY < py + ph - 4.5) {
      const isLastLine = index === descLines.length - 1;
      const alignOption = isLastLine ? "left" : "justify";
      doc.text(line, px, curY, { align: alignOption, maxWidth: leftW });
      curY += 1.3;
    }
  });
  curY += 0.4;

  if (d.destaque && curY < py + ph - 4.0) {
    let cleanDestaque = d.destaque.trim().replace(/^COM\s+/i, '').toUpperCase();

    doc.setFillColor(...pale);
    doc.setDrawColor(190, 210, 180);
    doc.setLineWidth(0.1);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.2); 
    doc.setTextColor(...green);

    const hlLines = doc.splitTextToSize(cleanDestaque, leftW - 0.8);
    const hlBoxH = (hlLines.length * 1.8) + 1.0;
    
    if (curY + hlBoxH <= py + ph - 3.5) {
      doc.roundedRect(px, curY, leftW, hlBoxH, 0.5, 0.5, "FD");
      doc.text(hlLines, px + leftW/2, curY + 1.5, { align: "center", lineHeightFactor: 1.0 });
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.0);
  doc.setTextColor(...black);
  doc.text(d.peso || "100g", px + leftW/2, py + ph - 0.6, { align: "center" });

  // ==================== COLUNA DIREITA ====================
  let sectionsArray = [];
  if (d.composicao) sectionsArray.push({title: "Composição", text: d.composicao});
  if (d.modo) sectionsArray.push({title: "Modo de usar", text: d.modo});
  if (d.atencao) sectionsArray.push({title: "Atenção", text: d.atencao});

  let totalTextHeight = 0;
  sectionsArray.forEach(sec => {
    totalTextHeight += 1.2 + 0.4 + 2.0; 
    const lines = doc.splitTextToSize(String(sec.text), rightW);
    totalTextHeight += (lines.length * 1.3) + 1.4;
  });

  const availableTopSpace = ph - 6.0;
  let rY = py + Math.max(2.1, ((availableTopSpace - totalTextHeight) / 2) + 1.8);

  sectionsArray.forEach(sec => {
    if (rY > py + ph - 6) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.0);
    doc.setTextColor(...green);
    doc.text(sec.title.toUpperCase(), rightX, rY);
    
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.1);
    doc.line(rightX, rY + 0.4, rightX + rightW, rY + 0.4);
    
    rY += 2.2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(3.5);
    doc.setTextColor(...black);
    const lines = doc.splitTextToSize(String(sec.text), rightW);
    
    lines.forEach((line, index) => {
      if (rY < py + ph - 5.5) {
        const isLastLine = index === lines.length - 1;
        const alignOption = isLastLine ? "left" : "justify";
        doc.text(line, rightX, rY, { align: alignOption, maxWidth: rightW });
        rY += 1.3;
      }
    });
    rY += 1.4;
  });

  const qrBoxSize = 6.6; 
  const qrX = rightX + rightW - qrBoxSize;
  const qrY = py + ph - qrBoxSize - 0.8;

  const contactW = rightW - qrBoxSize - 1.0;
  let contactY = Math.max(rY, py + ph - qrBoxSize - 0.8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.5);
  doc.setTextColor(...black);
  const contacts = [d.telefone, d.instagram || "@mosaboaria", d.email].filter(Boolean).join(" · ");
  if(contacts){
    const contactLines = doc.splitTextToSize(contacts, contactW);
    doc.text(contactLines, rightX, contactY, { lineHeightFactor: 1.05 });
    contactY += (contactLines.length * 1.2) + 0.4;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.1);
  doc.setTextColor(...black);
  const legalInfo = [d.marca || "Mô Saboaria", d.endereco || "Contagem/MG"].filter(Boolean).join(" · ");
  if(legalInfo){
    doc.text(doc.splitTextToSize(legalInfo, contactW), rightX, contactY);
    contactY += 1.5;
  }

  const datesText = [d.fabricacao ? "FAB: " + d.fabricacao : "", d.validade ? "VAL: " + d.validade : ""].filter(Boolean).join(" · ");
  if(datesText){
    doc.setFont("helvetica", "bold");
    doc.setFontSize(3.8);
    doc.setTextColor(...black);
    doc.text(datesText, rightX, contactY);
  }

  if (qrData) {
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX - 0.2, qrY - 0.2, qrBoxSize + 0.4, qrBoxSize + 0.4, "F");
    doc.addImage(qrData, "PNG", qrX, qrY, qrBoxSize, qrBoxSize);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(2.7);
    doc.setTextColor(...black);
    doc.text("INSTAGRAM", qrX + (qrBoxSize / 2), qrY + qrBoxSize + 0.75, { align: "center" });
  }
}

async function ensurePdfLibrary(){
  if(window.jspdf&&window.jspdf.jsPDF)return true;
  const urls=[
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
  ];
  for(const src of urls){
    try{
      await new Promise((resolve,reject)=>{
        const script=document.createElement("script");
        script.src=src;
        script.onload=resolve;
        script.onerror=()=>{script.remove();reject(new Error("Falha ao carregar biblioteca"))};
        document.head.appendChild(script);
      });
      if(window.jspdf&&window.jspdf.jsPDF)return true;
    }catch(e){}
  }
  return false;
}

$("generate-pdf").addEventListener("click",async()=>{
  const d=labels.find(x=>x.id===$("print-select").value);
  if(!d){notify("Selecione um rótulo antes de gerar o PDF.");return}
  const btn=$("generate-pdf"), oldText=btn.innerHTML;
  btn.disabled=true;btn.textContent="Preparando PDF…";
  try{
    const ready=await ensurePdfLibrary();
    if(!ready)throw new Error("Não foi possível carregar a biblioteca de PDF. Verifique sua conexão e tente novamente.");
    const pages=Math.max(1,Number($("print-pages").value)||1);
    const qrData=await getInstagramQRDataURL();
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
    
    const W = 210, H = 297;
    const dim = getDimensions();
    const labelW = dim.width * 10;
    const labelH = dim.height * 10;
    
    // Margens menores (4mm) e espaços otimizados (1.5mm) para máximo aproveitamento da folha A4
    const marginX = 4;
    const marginY = 4;
    const gapX = 1.5;
    const gapY = 1.5;
    
    const cols = Math.floor((W - (2 * marginX) + gapX) / (labelW + gapX));
    const rows = Math.floor((H - (2 * marginY) + gapY) / (labelH + gapY));
    
    // Centralização automática da grade na folha A4
    const totalGridW = (cols * labelW) + ((cols - 1) * gapX);
    const totalGridH = (rows * labelH) + ((rows - 1) * gapY);
    const startX = Math.max(marginX, (W - totalGridW) / 2);
    const startY = Math.max(marginY, (H - totalGridH) / 2);

    for(let page = 0; page < pages; page++){
      if(page > 0) doc.addPage("a4", "portrait");
      for(let r = 0; r < rows; r++){
        for(let c = 0; c < cols; c++){
          const x = startX + c * (labelW + gapX);
          const y = startY + r * (labelH + gapY);
          if(x + labelW <= W - marginX + 0.01 && y + labelH <= H - marginY + 0.01){
            drawLabel(doc, x, y, labelW, labelH, d, qrData);
          }
        }
      }
    }
    const safe = (d.nome || "rotulo").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    doc.save(`rotulos-${safe||"sabonete"}-${String(dim.width).replace(".","-")}x${String(dim.height).replace(".","-")}cm.pdf`);
    notify(`PDF gerado com ${cols*rows} rótulos por folha (${dim.width} × ${dim.height} cm; ${pages} folha(s)).`);
  }catch(err){console.error(err);notify(err.message||"Erro ao gerar PDF. Tente novamente.")}
  finally{btn.disabled=false;btn.innerHTML=oldText}
});

$("export-json").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify({app:"Atelie Natural - Gerador de Rotulos",version:1,exportedAt:new Date().toISOString(),labels},null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="backup-rotulos-sabonetes.json";
  a.click();
  URL.revokeObjectURL(a.href);
  notify("Backup JSON exportado.");
});

$("import-json").addEventListener("change",async e=>{
  const file=e.target.files[0];
  if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    const incoming=Array.isArray(data)?data:data.labels;
    if(!Array.isArray(incoming))throw new Error("Formato inválido");
    const clean=incoming.filter(x=>x&&typeof x.nome==="string").map(x=>({...x,id:uid(),createdAt:x.createdAt||new Date().toISOString()}));
    labels=[...clean,...labels];
    persist();
    notify(`${clean.length} cadastro(s) importado(s).`);
  }catch(err){notify("Não foi possível importar. Verifique o arquivo JSON.");}
  e.target.value="";
});

renderRepository();refreshPrintSelect();