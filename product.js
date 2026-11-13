let products=[];
let bag=JSON.parse(localStorage.getItem("ah-bag")||"[]");
const $=selector=>document.querySelector(selector);

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
}

function toast(message){
  const target=$("#toast");
  target.textContent=message;
  target.classList.add("show");
  setTimeout(()=>target.classList.remove("show"),2600);
}

function renderBag(){
  $("#bag-count").textContent=bag.reduce((sum,item)=>sum+item.qty,0);
  $("#bag-items").innerHTML=bag.length?bag.map(item=>{const photo=Array.isArray(item.photos)?item.photos[0]:null;return `<div class="bag-item">${photo?`<img class="bag-item-image" src="${escapeHtml(photo)}" alt="" />`:`<span class="bag-item-image bag-item-placeholder"></span>`}<div class="bag-item-copy">${escapeHtml(item.name)}<small>$${item.price} × ${item.qty}</small></div><button class="remove-item" data-remove="${escapeHtml(item.id)}">Remove</button></div>`}).join(""):`<p class="fine-print">Your bag is waiting for something special.</p>`;
  $("#bag-total").textContent="$"+bag.reduce((sum,item)=>sum+item.price*item.qty,0);
}

async function loadProduct(){
  const id=new URLSearchParams(location.search).get("id");
  const response=await fetch("/api/products");
  if(!response.ok)return showMissing();
  products=await response.json();
  const product=products.find(item=>String(item.id)===id);
  if(!product)return showMissing();

  document.title=`${product.name} · After Hours Crafts`;
  const photos=Array.isArray(product.photos)?product.photos:[];
  $("#product-detail").innerHTML=`<article class="product-detail"><div class="product-gallery">${photos.length?`<div class="product-gallery-main" data-index="0"><img src="${escapeHtml(photos[0])}" alt="${escapeHtml(product.name)}" />${photos.length>1?`<button class="gallery-button prev" data-direction="-1" aria-label="Previous photo">←</button><button class="gallery-button next" data-direction="1" aria-label="Next photo">→</button>`:""}</div><div class="gallery-thumbs">${photos.map((photo,index)=>`<button class="${index===0?"active":""}" data-photo="${index}" aria-label="View photo ${index+1}"><img src="${escapeHtml(photo)}" alt="" /></button>`).join("")}</div>`:`<div class="product-gallery-main"></div>`}</div><div class="product-copy"><p class="eyebrow">${escapeHtml(product.category)}</p><h1>${escapeHtml(product.name)}</h1><p class="product-price">$${product.price}</p>${product.description?`<p class="product-long-description">${escapeHtml(product.description)}</p>`:""}<p class="stock-note">${product.stock>0?`${product.stock} available`:"Currently sold out"}</p><button class="button button-pink" data-add="${escapeHtml(product.id)}" ${product.stock>0?"":"disabled"}>Add to bag <span>+</span></button></div></article>`;
}

function showMissing(){
  $("#product-detail").innerHTML="<h1>We couldn't find that product.</h1><p>It may no longer be available.</p>";
}

async function beginCheckout(){
  if(!bag.length){toast("Your bag is empty.");return}
  const button=$("#checkout-btn");button.disabled=true;button.textContent="Opening checkout…";
  try{
    const response=await fetch("/api/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({items:bag.map(item=>({id:item.id,quantity:item.qty}))})});
    if(!response.ok)throw new Error(await response.text());
    location.href=(await response.json()).url;
  }catch(error){toast(error.message||"Checkout could not be opened.");button.disabled=false;button.innerHTML='checkout <span>↗</span>'}
}

document.addEventListener("click",event=>{
  const direction=event.target.closest("[data-direction]");
  const thumb=event.target.closest("[data-photo]");
  if(direction||thumb){
    const gallery=$(".product-gallery-main"),buttons=[...document.querySelectorAll("[data-photo]")],photos=buttons.map(button=>button.querySelector("img").src);
    let index=thumb?Number(thumb.dataset.photo):(Number(gallery.dataset.index)+Number(direction.dataset.direction)+photos.length)%photos.length;
    gallery.dataset.index=index;
    gallery.querySelector("img").src=photos[index];
    buttons.forEach((button,buttonIndex)=>button.classList.toggle("active",buttonIndex===index));
  }
  const add=event.target.closest("[data-add]");
  if(add){
    const product=products.find(item=>item.id==add.dataset.add),found=bag.find(item=>item.id==product.id);
    found?found.qty++:bag.push({...product,qty:1});
    localStorage.setItem("ah-bag",JSON.stringify(bag));
    renderBag();
    toast(`${product.name} added to your bag`);
  }
  const remove=event.target.closest("[data-remove]");
  if(remove){bag=bag.filter(item=>item.id!=remove.dataset.remove);localStorage.setItem("ah-bag",JSON.stringify(bag));renderBag()}
  if(event.target.closest("#bag-btn")){$("#bag-panel").classList.add("open");document.body.style.overflow="hidden"}
  if(event.target.closest(".close-panel")||event.target.classList.contains("overlay")){$("#bag-panel").classList.remove("open");document.body.style.overflow=""}
  if(event.target.closest(".menu-toggle"))$(".site-header nav")?.classList.toggle("open");
});

$("#checkout-btn").addEventListener("click",beginCheckout);
renderBag();
loadProduct();
