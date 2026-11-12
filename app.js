let products=[
  {id:1,name:"Patchwork market tote",category:"wear",price:48,stock:8,color:"#ef725f",tilt:"-8deg"},
  {id:2,name:"Sunday table runner",category:"home",price:62,stock:4,color:"#5267d6",tilt:"9deg"},
  {id:3,name:"Pocket-sized pincushion",category:"gifts",price:18,stock:12,color:"#dce64b",tilt:"-3deg"},
  {id:4,name:"The everyday bucket hat",category:"wear",price:54,stock:6,color:"#c98f70",tilt:"8deg"}
];
let bag=JSON.parse(localStorage.getItem("ah-bag")||"[]");
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function toast(message){const target=$("#toast");if(!target)return;target.textContent=message;target.classList.add("show");setTimeout(()=>target.classList.remove("show"),2600)}
function renderProducts(filter="all"){const grid=$("#product-grid");if(!grid)return;grid.innerHTML=products.filter(p=>filter==="all"||p.category===filter).map(p=>{const photos=Array.isArray(p.photos)?p.photos:[];return `<article class="product"><div class="product-image ${photos.length?"has-photos":""}" data-carousel="${p.id}" data-index="0" style="--shape:${p.color};--tilt:${p.tilt}">${photos[0]?`<img src="${photos[0]}" alt="${p.name}" />`:""}${photos.length>1?`<button class="carousel-prev" data-carousel-prev="${p.id}" aria-label="Previous photo">←</button><button class="carousel-next" data-carousel-next="${p.id}" aria-label="Next photo">→</button>`:""}<button class="add-button" data-add="${p.id}" aria-label="Add ${p.name}">+</button></div><div class="product-info"><span>${p.name}</span><small>$${p.price}</small>${p.description?`<p class="product-description">${p.description}</p>`:""}</div></article>`}).join("")}
function renderBag(){const count=bag.reduce((sum,item)=>sum+item.qty,0),countEl=$("#bag-count");if(countEl)countEl.textContent=count;const items=$("#bag-items");if(!items)return;items.innerHTML=bag.length?bag.map(item=>`<div class="bag-item"><div>${item.name}<small>$${item.price} × ${item.qty}</small></div><button class="remove-item" data-remove="${item.id}">Remove</button></div>`).join(""):`<p class="fine-print">Your bag is waiting for something special.</p>`;$("#bag-total").textContent="$"+bag.reduce((sum,item)=>sum+item.price*item.qty,0)}
function closePanels(){$$(".overlay.open").forEach(panel=>panel.classList.remove("open"));document.body.style.overflow=""}
function openPanel(id){const panel=$(id);if(panel){panel.classList.add("open");document.body.style.overflow="hidden"}}
renderProducts();renderBag();
fetch("/api/products").then(response=>response.ok?response.json():Promise.reject()).then(data=>{if(Array.isArray(data)&&data.length){products=data;renderProducts()}}).catch(()=>{});
document.addEventListener("click",event=>{
  const add=event.target.closest("[data-add]");
  if(add){const product=products.find(item=>item.id==add.dataset.add);if(!product)return;const found=bag.find(item=>item.id==product.id);found?found.qty++:bag.push({...product,qty:1});localStorage.setItem("ah-bag",JSON.stringify(bag));renderBag();toast(`${product.name} added to your bag`)}
  const remove=event.target.closest("[data-remove]");
  if(remove){bag=bag.filter(item=>item.id!=remove.dataset.remove);localStorage.setItem("ah-bag",JSON.stringify(bag));renderBag()}
  const next=event.target.closest("[data-carousel-next]"),prev=event.target.closest("[data-carousel-prev]");
  if(next||prev){const button=next||prev,product=products.find(item=>item.id===(button.dataset.carouselNext||button.dataset.carouselPrev)),image=button.closest("[data-carousel]"),photos=product?.photos||[];if(product&&photos.length){let index=Number(image.dataset.index)||0;index=(index+(next?1:-1)+photos.length)%photos.length;image.dataset.index=index;image.querySelector("img").src=photos[index]}}
  if(event.target.closest("#bag-btn"))openPanel("#bag-panel");
  if(event.target.closest(".close-panel")||event.target.classList.contains("overlay"))closePanels();
  if(event.target.closest("#search-btn"))toast("Search is coming soon — try browsing the shop.");
  const filter=event.target.closest(".filter");
  if(filter){$$(".filter").forEach(item=>item.classList.remove("active"));filter.classList.add("active");renderProducts(filter.dataset.filter)}
  if(event.target.closest(".menu-toggle"))$(".site-header nav")?.classList.toggle("open");
});
$("#checkout-btn")?.addEventListener("click",()=>toast("Connect Stripe Checkout here to accept payments."));
const calendarDays=$("#calendar-days");
if(calendarDays){
  const today=new Date();let shown=new Date(today.getFullYear(),today.getMonth(),1),chosen=null;
  function renderCalendar(){const year=shown.getFullYear(),month=shown.getMonth(),first=new Date(year,month,1).getDay(),last=new Date(year,month+1,0).getDate();$("#month-label").textContent=shown.toLocaleDateString("en-US",{month:"long",year:"numeric"});calendarDays.innerHTML="";for(let i=0;i<first;i++)calendarDays.innerHTML+="<span></span>";for(let day=1;day<=last;day++){const date=new Date(year,month,day),past=date<new Date(today.getFullYear(),today.getMonth(),today.getDate()),weekend=date.getDay()===0||date.getDay()===6;calendarDays.innerHTML+=`<button ${past||weekend?"disabled":""} data-day="${day}" class="${chosen&&chosen.getTime()===date.getTime()?"selected":""}">${day}</button>`}}
  renderCalendar();$("#prev-month").onclick=()=>{shown.setMonth(shown.getMonth()-1);renderCalendar()};$("#next-month").onclick=()=>{shown.setMonth(shown.getMonth()+1);renderCalendar()};calendarDays.addEventListener("click",event=>{if(!event.target.dataset.day)return;chosen=new Date(shown.getFullYear(),shown.getMonth(),event.target.dataset.day);$("#selected-date").textContent=chosen.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});$("#reserve-btn").disabled=false;renderCalendar()});$("#reserve-btn").onclick=()=>toast("Date noted! We'll email you to confirm your session.");
}
