const products=[
  {id:1,name:"Patchwork market tote",category:"wear",price:48,stock:8,color:"#ef725f",tilt:"-8deg"},
  {id:2,name:"Sunday table runner",category:"home",price:62,stock:4,color:"#5267d6",tilt:"9deg"},
  {id:3,name:"Pocket-sized pincushion",category:"gifts",price:18,stock:12,color:"#dce64b",tilt:"-3deg"},
  {id:4,name:"The everyday bucket hat",category:"wear",price:54,stock:6,color:"#c98f70",tilt:"8deg"}
];
let bag=JSON.parse(localStorage.getItem("tg-bag")||"[]"), stock=JSON.parse(localStorage.getItem("tg-stock")||"null")||Object.fromEntries(products.map(p=>[p.id,p.stock]));
const $=s=>document.querySelector(s);
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function renderProducts(filter="all"){const grid=$("#product-grid");grid.innerHTML=products.filter(p=>filter==="all"||p.category===filter).map(p=>`<article class="product"><div class="product-image" style="--shape:${p.color};--tilt:${p.tilt}"><span>${String(p.id).padStart(2,"0")}</span><button data-add="${p.id}" aria-label="Add ${p.name}">+</button></div><div class="product-info"><span>${p.name}</span><small>$${p.price}</small></div></article>`).join("")}
function renderBag(){const count=bag.reduce((a,i)=>a+i.qty,0);$("#bag-count").textContent=count;const items=$("#bag-items");items.innerHTML=bag.length?bag.map(i=>`<div class="bag-item"><div>${i.name}<small>$${i.price} × ${i.qty}</small></div><button class="remove-item" data-remove="${i.id}">Remove</button></div>`).join(""):`<p class="muted">Your bag is waiting for something special.</p>`;$("#bag-total").textContent="$"+bag.reduce((a,i)=>a+i.price*i.qty,0);$("#checkout-btn").disabled=!bag.length}
function openPanel(id){$(id).classList.add("open");document.body.style.overflow="hidden"}function closePanels(){$$(".overlay.open").forEach(x=>x.classList.remove("open"));document.body.style.overflow=""}
function $$(s){return [...document.querySelectorAll(s)]}
renderProducts();renderBag();
document.addEventListener("click",e=>{
 const add=e.target.closest("[data-add]");if(add){const p=products.find(x=>x.id==add.dataset.add);if((stock[p.id]||0)<1)return toast("That piece is currently sold out.");const found=bag.find(x=>x.id==p.id);found?found.qty++:bag.push({...p,qty:1});localStorage.setItem("tg-bag",JSON.stringify(bag));renderBag();toast(`${p.name} added to your bag`)}
 const remove=e.target.closest("[data-remove]");if(remove){bag=bag.filter(x=>x.id!=remove.dataset.remove);localStorage.setItem("tg-bag",JSON.stringify(bag));renderBag()}
 if(e.target.closest("#bag-btn"))openPanel("#bag-panel");if(e.target.closest(".close-panel"))closePanels();if(e.target.classList.contains("overlay"))closePanels();
 if(e.target.closest(".admin-link")){e.preventDefault();openPanel("#admin-panel")}
 if(e.target.closest("#search-btn"))toast("Search is coming soon — try browsing the shop.");
 const f=e.target.closest(".filter");if(f){$$(".filter").forEach(x=>x.classList.remove("active"));f.classList.add("active");renderProducts(f.dataset.filter)}
 if(e.target.closest(".menu-toggle"))$(".main-nav").classList.toggle("open");
 if(e.target.closest("#book-lesson"))$("#calendar").scrollIntoView({behavior:"smooth"});
});
$("#login-form").addEventListener("submit",e=>{e.preventDefault();if($("#login-email").value==="owner@afterhourscrafts.co"&&$("#login-password").value==="groove"){$("#login-view").hidden=true;$("#inventory-view").hidden=false;renderInventory();toast("Welcome back to the studio")}else toast("That login doesn't match our studio account.")});
function renderInventory(){$("#inventory-list").innerHTML=products.map(p=>`<div class="inventory-row"><span>${p.name}</span><input type="number" min="0" value="${stock[p.id]}" data-stock="${p.id}" /></div>`).join("")}
$("#save-inventory").addEventListener("click",()=>{$$("[data-stock]").forEach(i=>stock[i.dataset.stock]=Number(i.value));localStorage.setItem("tg-stock",JSON.stringify(stock));renderProducts();toast("Inventory saved")});
$("#sign-out").addEventListener("click",()=>{$("#login-view").hidden=false;$("#inventory-view").hidden=true;closePanels()});
$("#checkout-btn").addEventListener("click",()=>toast("Connect Stripe Checkout here to accept orders."));
const now=new Date();let shown=new Date(now.getFullYear(),now.getMonth(),1), chosen=null;
function renderCalendar(){const y=shown.getFullYear(),m=shown.getMonth();$("#month-label").textContent=shown.toLocaleDateString("en-US",{month:"long",year:"numeric"});const first=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate(),days=$("#calendar-days");days.innerHTML="";for(let i=0;i<first;i++)days.innerHTML+="<span></span>";for(let d=1;d<=last;d++){const date=new Date(y,m,d), past=date<new Date(now.getFullYear(),now.getMonth(),now.getDate()), weekend=date.getDay()===0||date.getDay()===6;days.innerHTML+=`<button ${past||weekend?"disabled":""} data-day="${d}" class="${chosen&&chosen.getTime()===date.getTime()?"selected":""}">${d}</button>`}}
renderCalendar();$("#prev-month").onclick=()=>{shown.setMonth(shown.getMonth()-1);renderCalendar()};$("#next-month").onclick=()=>{shown.setMonth(shown.getMonth()+1);renderCalendar()};$("#calendar-days").addEventListener("click",e=>{if(!e.target.dataset.day)return;chosen=new Date(shown.getFullYear(),shown.getMonth(),e.target.dataset.day);$("#selected-date").textContent=chosen.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});$("#reserve-btn").disabled=false;renderCalendar()});$("#reserve-btn").onclick=()=>toast("Date noted! We'll email you to confirm your session.");
$("#newsletter").addEventListener("submit",e=>{e.preventDefault();e.target.reset();toast("You're on the list — see you soon.")});
