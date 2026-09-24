(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const api = `${window.LINDSELL_SITE_CONFIG.supabaseUrl}/functions/v1/club-shop`;
  const previewMode = new URLSearchParams(location.search).get('preview') === '1';
  const money = pennies => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(pennies / 100);
  const basketKey='lcc-awards-dinner-2026-basket-v1';
  let catalog, card, busy=false, locked=false, basketItems=[], editingId=null, detailsOpen=false, storageAvailable=true;
  const choiceId = (p,n,f) => `choice-${p.id}-${n}-${f.key}`;
  const chosen = () => basketItems.map(item=>({id:item.id,quantity:item.quantity,customisations:item.customisations}));
  function total() {
    return chosen().reduce((sum,item)=>{
      const p=catalog.products.find(p=>p.id===item.id);
      return sum+item.quantity*p.pricePence+item.customisations.reduce((extra,c)=>extra+p.fields.filter(f=>f.kind==='checkbox'&&c[f.key]).reduce((n,f)=>n+f.pricePence,0),0);
    },0);
  }
  function saveBasket() {
    try {
      if(basketItems.length) localStorage.setItem(basketKey,JSON.stringify({items:chosen(),prices:Object.fromEntries(catalog.products.map(p=>[p.id,p.pricePence])),savedAt:Date.now()}));
      else localStorage.removeItem(basketKey);
      storageAvailable=true;
    } catch { storageAvailable=false; }
    $('basket-note').textContent=storageAvailable
      ? 'Your basket is saved on this device, including guest names and meal choices. Contact and card details are not saved.'
      : 'Your browser is not allowing basket storage. Keep this page open until you finish.';
  }
  function restoreBasket() {
    try {
      const saved=JSON.parse(localStorage.getItem(basketKey)||'null');
      if(!saved || !Array.isArray(saved.items)) return;
      let changed=false;const seen=new Set();
      basketItems=saved.items.flatMap(item=>{
        const p=catalog.products.find(p=>p.id===item?.id && p.available);
        if(!p || seen.has(item.id) || !Number.isInteger(item.quantity) || item.quantity<1 || item.quantity>p.maxQuantity || !Array.isArray(item.customisations) || item.customisations.length!==item.quantity){changed=true;return [];}
        seen.add(item.id);
        const valid=item.customisations.every(answer=>answer && typeof answer==='object' && p.fields.every(f=>
          f.kind==='text' ? typeof answer[f.key]==='string' && answer[f.key].trim().length>0 && answer[f.key].length<=100
          : f.kind==='select' ? f.choices.includes(answer[f.key]) : typeof answer[f.key]==='boolean'));
        if(!valid){changed=true;return [];}
        if(saved.prices?.[p.id]!==p.pricePence)changed=true;
        return [{id:p.id,quantity:item.quantity,customisations:item.customisations.map(answer=>Object.fromEntries(p.fields.map(f=>[f.key,answer[f.key]])))}];
      });
      if(basketItems.length) $('basket-feedback').textContent=changed
        ? 'Your saved basket was updated. Please review the items and current total.'
        : 'Your saved basket has been restored.';
      if(changed)saveBasket();
    } catch { /* The shop still works if saved data is unavailable. */ }
  }
  const error = message => { $('payment-error').textContent=message; $('payment-error').hidden=!message; };
  const setBusy = value => { busy=value; $('pay-button').disabled=value||locked||!card||!detailsOpen||!!editingId||!total(); $('pay-button').textContent=value?'Processing payment…':total()?`Pay ${money(total())}`:'Choose items'; };
  function productImage(p) {
    if (!p.image) return null;
    const img=document.createElement('img'); img.src=p.image; img.alt=p.name; img.loading='lazy'; img.className='shop-product-image';
    const button=document.createElement('button'); button.type='button'; button.className='shop-image-button'; button.setAttribute('aria-label',`Enlarge image of ${p.name}`);
    button.append(img); button.addEventListener('click',()=>{
      const enlarged=new URL(p.image,location.href); if(enlarged.searchParams.has('width'))enlarged.searchParams.set('width','1600');
      $('shop-image-full').src=enlarged.href;$('shop-image-full').alt=p.name;$('shop-image-caption').textContent=p.name;
      $('shop-image-dialog').showModal();
    });
    return button;
  }
  function renderOrder() {
    const lines=$('order-lines'); lines.replaceChildren(); const items=chosen();
    if (!items.length) lines.textContent='Select items to see your total.';
    for (const item of items) {
      const p=catalog.products.find(p=>p.id===item.id);
      const row=document.createElement('div'); row.className='shop-summary-line';
      const label=document.createElement('span'); label.textContent=`${item.quantity} × ${p.name}`;
      const price=document.createElement('strong'); price.textContent=money(item.quantity*p.pricePence);
      row.append(label,price); lines.append(row);
      item.customisations.forEach((c,n)=>{
        if(!p.fields.length)return;
        const detail=document.createElement('p'); detail.className='shop-summary-detail';
        const menu=p.fields.filter(f=>f.kind==='select').map(f=>c[f.key]).filter(Boolean).join(' / ');
        detail.textContent=`${c.attendeeName || `Guest ${n+1}`}${menu?`: ${menu}`:''}${c.cheese?' · cheese course':''}`;
        lines.append(detail);
        if(c.cheese){const extra=document.createElement('div');extra.className='shop-summary-line';
          const text=document.createElement('span');text.textContent='Additional cheese course';
          const cost=document.createElement('strong');cost.textContent=money(p.fields.find(f=>f.key==='cheese').pricePence);
          extra.append(text,cost);lines.append(extra);}
      });
      const actions=document.createElement('div');actions.className='shop-item-actions';
      const edit=document.createElement('button');edit.type='button';edit.textContent='Edit';edit.addEventListener('click',()=>editItem(p));
      const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.addEventListener('click',()=>removeItem(p.id));
      actions.append(edit,remove);lines.append(actions);
    }
    $('order-total').textContent=money(total());
    $('continue-to-details').disabled=!items.length;
    $('clear-basket').hidden=!items.length;
    setBusy(busy);
  }
  function renderDraft(p,preset=[],reset=false) {
    const box=$(`draft-${p.id}`), old={};
    for(const input of box.querySelectorAll('[data-choice]'))old[input.id]=input.type==='checkbox'?input.checked:input.value;
    box.replaceChildren();
    const count=Number($(`qty-${p.id}`).value);
    for(let n=0;n<count && p.fields.length;n++){
      const group=document.createElement('section');group.className='shop-guest';
      const title=document.createElement('h4');title.textContent=`${p.name} ${n+1}`;group.append(title);
      for(const f of p.fields){
        const label=document.createElement('label');label.textContent=f.label+(f.kind==='checkbox'?` (+${money(f.pricePence)})`:'');
        const id=choiceId(p,n,f);let input;
        if(f.kind==='select'){
          input=document.createElement('select');const blank=document.createElement('option');blank.value='';blank.textContent='Select one';input.append(blank);
          for(const value of f.choices){const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);}
          // Draft choices are checked before Add to basket, not at final payment.
        }else{
          input=document.createElement('input');input.type=f.kind==='checkbox'?'checkbox':'text';
          if(f.kind==='text'){input.maxLength=100;input.autocomplete='off';}
          else label.classList.add('shop-check');
        }
        input.id=id;input.dataset.choice='';
        const value=preset[n]?.[f.key] ?? (reset?undefined:old[id]);
        if(value!==undefined){if(f.kind==='checkbox')input.checked=value===true;else input.value=value;}
        label.append(input);group.append(label);
      }
      box.append(group);
    }
  }
  function readDraft(p){
    const choices=[];
    $(`draft-feedback-${p.id}`).textContent='';
    for(let n=0;n<Number($(`qty-${p.id}`).value);n++){
      const answer={};
      for(const f of p.fields){
        const input=$(choiceId(p,n,f));const value=f.kind==='checkbox'?input.checked:input.value.trim();
        if(f.kind==='text'&&!value || f.kind==='select'&&!f.choices.includes(value)){
          $(`draft-feedback-${p.id}`).textContent=`Please complete ${f.label.toLowerCase()} for ${p.name} ${n+1}.`;
          input.focus();input.reportValidity();return null;
        }
        answer[f.key]=value;
      }
      choices.push(answer);
    }
    return choices;
  }
  function addItem(p){
    const choices=readDraft(p);if(!choices)return;
    if(editingId && editingId!==p.id)$(`add-${editingId}`).textContent='Add to basket';
    const current=basketItems.find(item=>item.id===p.id);
    const updating=editingId===p.id;
    const combined=updating?choices:[...(current?.customisations||[]),...choices];
    if(combined.length>p.maxQuantity){$(`draft-feedback-${p.id}`).textContent=`Maximum ${p.maxQuantity} per item. Edit the basket to change your selection.`;return;}
    basketItems=basketItems.filter(item=>item.id!==p.id);
    basketItems.push({id:p.id,quantity:combined.length,customisations:combined});
    editingId=null;
    $(`add-${p.id}`).textContent='Add to basket';
    $(`qty-${p.id}`).value='1';renderDraft(p,[],true);
    $(`draft-feedback-${p.id}`).textContent=updating?'Basket updated.':'Added to basket.';
    $('basket-feedback').textContent='Your basket is ready. Continue to contact details when you have everything.';
    saveBasket();renderOrder();
  }
  function editItem(p){
    const item=basketItems.find(item=>item.id===p.id);if(!item)return;
    if(editingId && editingId!==p.id)$(`add-${editingId}`).textContent='Add to basket';
    editingId=p.id;
    $(`qty-${p.id}`).value=String(item.quantity);
    renderDraft(p,item.customisations);
    $(`add-${p.id}`).textContent='Update basket';
    $(`draft-feedback-${p.id}`).textContent='Make your changes, then update the basket.';
    setBusy(busy);
    $(`product-${p.id}`).scrollIntoView({behavior:'smooth',block:'start'});
  }
  function removeItem(id){
    basketItems=basketItems.filter(item=>item.id!==id);
    if(editingId===id){editingId=null;$(`add-${id}`).textContent='Add to basket';$(`qty-${id}`).value='1';renderDraft(catalog.products.find(p=>p.id===id),[],true);}
    if(!basketItems.length){detailsOpen=false;$('booking-panel').hidden=true;$('payment-panel').hidden=true;}
    saveBasket();renderOrder();
  }
  function renderProducts() {
    const list=$('product-list'); list.replaceChildren();
    for (const p of catalog.products) {
      const row=document.createElement('div'); row.id=`product-${p.id}`;row.className='shop-product'+(p.available?'':' shop-product-unavailable');
      const detail=document.createElement('div');
      const name=document.createElement('strong'); name.textContent=p.name;
      const description=document.createElement('p'); description.textContent=p.description||'';
      const price=document.createElement('span'); price.className='shop-price'; price.textContent=p.available?money(p.pricePence):'Currently unavailable';
      const copy=document.createElement('div'); copy.append(name,description,price);
      detail.className='shop-product-info';
      const image=productImage(p); if(image) detail.append(image);
      detail.append(copy);
      const select=document.createElement('select'); select.id=`qty-${p.id}`; select.setAttribute('aria-label',`Quantity: ${p.name}`); select.disabled=!p.available;
      for(let n=1;n<=(p.available?p.maxQuantity:1);n++){const option=document.createElement('option');option.value=n;option.textContent=n;select.append(option);}
      select.addEventListener('change',()=>renderDraft(p));
      const qtyLabel=document.createElement('label');qtyLabel.className='shop-quantity';qtyLabel.textContent='Quantity';qtyLabel.append(select);
      const draft=document.createElement('div');draft.id=`draft-${p.id}`;draft.className='shop-customisations';
      const actions=document.createElement('div');actions.className='shop-product-actions';
      const feedback=document.createElement('span');feedback.id=`draft-feedback-${p.id}`;feedback.setAttribute('role','status');
      const add=document.createElement('button');add.id=`add-${p.id}`;add.type='button';add.className='btn primary';add.textContent='Add to basket';add.disabled=!p.available;add.addEventListener('click',()=>addItem(p));
      actions.append(feedback,add);row.append(detail,qtyLabel,draft,actions);list.append(row);
      if(p.available)renderDraft(p);
    }
    renderOrder();
  }
  function renderPreview() {
    const list=$('shop-preview-products'); list.replaceChildren();
    for(const p of catalog.products){
      const card=document.createElement('div'); card.className='shop-preview-item';
      const name=document.createElement('strong'); name.textContent=p.name;
      const price=document.createElement('span'); price.textContent=p.pricePence?`${money(p.pricePence)} guide price`:'Price to be confirmed';
      const image=productImage(p);if(image)card.append(image);
      const description=document.createElement('p');description.textContent=p.description||'';
      card.append(name,description,price);list.append(card);
    }
  }
  async function loadSquare(sandbox) {
    const script=document.createElement('script'); script.src=sandbox?'https://sandbox.web.squarecdn.com/v1/square.js':'https://web.squarecdn.com/v1/square.js';
    await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.append(script);});
  }
  async function init() {
    try {
      if(previewMode){
        const preview=await fetch('assets/data/shop-preview.json?v=1.3.27',{cache:'no-store'});
        if(!preview.ok) throw new Error('The interactive preview is temporarily unavailable.');
        catalog=await preview.json();catalog.salesOpen=false;
      }else{
        try {
          const response=await fetch(api,{cache:'no-store'});
          if(!response.ok) throw new Error('Shop API unavailable');
          catalog=await response.json();
        } catch {
          const preview=await fetch('assets/data/shop-preview.json?v=1.3.27',{cache:'no-store'});
          if(!preview.ok) throw new Error('The shop is temporarily unavailable. Please try again later.');
          catalog=await preview.json();catalog.salesOpen=false;
        }
      }
      $('event-title').textContent=catalog.event.title;
      $('event-description').textContent=catalog.event.description||'';
      $('event-details').textContent=[catalog.event.date,catalog.event.venue].filter(Boolean).join(' · ');
      $('shop-loading').hidden=true; $('shop-content').hidden=false;
      if(!catalog.salesOpen){
        $('shop-closed').hidden=false;
        if(!previewMode){renderPreview();return;}
        if(!catalog.products.every(p=>Array.isArray(p.fields) && Number.isInteger(p.maxQuantity))) {
          throw new Error('The interactive preview is temporarily unavailable.');
        }
        catalog.products=catalog.products.map(p=>({...p,available:true}));
        $('shop-closed').classList.add('shop-review-note');
        $('shop-closed').querySelector('h3').textContent='Shop review — no bookings are being taken';
        $('shop-closed-copy').textContent='Choose attendees and menu options, add them to your basket, then review the contact details step. No order or payment will be submitted.';
        $('shop-review-link').hidden=true;
        $('shop-badge').textContent='Review mode · checkout closed';
        $('order-heading').textContent='Your order preview';
        $('order-help').textContent='No order will be placed from this preview.';
        document.body.classList.add('shop-preview-mode');
        renderProducts();restoreBasket();renderOrder();$('shop-open').hidden=false;return;
      }
      $('shop-badge').textContent='Secure card payment by Square';
      renderProducts();restoreBasket();renderOrder();$('shop-open').hidden=false;
      await loadSquare(catalog.sandbox);
      if(!window.Square) throw new Error('The secure card form could not load. Please refresh the page.');
      const payments=window.Square.payments(catalog.applicationId,catalog.locationId);
      card=await payments.card();await card.attach('#card-container');renderOrder();
    } catch(e){$('shop-loading').hidden=true;$('shop-message').hidden=false;$('shop-message').textContent=e.message||'The shop is temporarily unavailable.';$('shop-open').hidden=true;}
  }
  async function submit(event) {
    event.preventDefault();if(busy||locked||!card||!detailsOpen||editingId)return;error('');
    if(!$('checkout-form').reportValidity())return;
    if(!total()){error('Please choose at least one item.');return;}
    setBusy(true);
    const name=$('buyer-name').value.trim(),email=$('buyer-email').value.trim(),phone=$('buyer-phone').value.trim(),checkoutId=crypto.randomUUID();
    let submitted=false;
    try {
      const quote=total();
      const token=await card.tokenize({amount:(quote/100).toFixed(2),currencyCode:'GBP',intent:'CHARGE',customerInitiated:true,sellerKeyedIn:false,
        billingContact:{givenName:name.split(/\s+/)[0],familyName:name.split(/\s+/).slice(1).join(' ')||undefined,email,phone,countryCode:'GB'}});
      if(token.status!=='OK')throw new Error('Card details could not be verified. Please check them and try again.');
      submitted=true;
      const response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        checkoutId,catalogRevision:catalog.revision,quotedTotal:quote,sourceId:token.token,items:chosen(),
        buyerName:name,email,phone,dietary:$('dietary').value.trim()
      })});
      const result=await response.json();submitted=false;
      if(!response.ok){if(result.uncertain){locked=true;error(`Your payment status is being checked. Please do not pay again. Contact info@lindsellcc.co.uk with reference ${checkoutId}.`);return;}throw new Error(result.error||'Payment could not be completed.');}
      basketItems=[];saveBasket();
      $('shop-content').hidden=true;$('shop-success').hidden=false;
      $('booking-reference').textContent=`Order reference: ${checkoutId}`;
      if(result.receiptUrl&&/^https:\/\//.test(result.receiptUrl)){$('receipt-link').href=result.receiptUrl;$('receipt-link').hidden=false;}
      $('shop-success').focus();
    } catch(e){if(submitted){locked=true;error(`The connection dropped while checking payment. Please do not pay again. Contact info@lindsellcc.co.uk with reference ${checkoutId}.`);}else error(e.message||'Payment could not be completed. Please try again.');}
    finally{setBusy(false);}
  }
  $('continue-to-details').addEventListener('click',()=>{
    if(!basketItems.length)return;
    detailsOpen=true;$('booking-panel').hidden=false;
    $('payment-panel').hidden=previewMode;
    $('booking-panel').scrollIntoView({behavior:'smooth',block:'start'});
    setBusy(busy);
  });
  $('clear-basket').addEventListener('click',()=>{
    basketItems=[];editingId=null;detailsOpen=false;
    $('booking-panel').hidden=true;$('payment-panel').hidden=true;
    for(const p of catalog.products){$(`add-${p.id}`).textContent='Add to basket';$(`qty-${p.id}`).value='1';if(p.available)renderDraft(p,[],true);}
    $('basket-feedback').textContent='Basket cleared.';saveBasket();renderOrder();
  });
  $('shop-image-close').addEventListener('click',()=>$('shop-image-dialog').close());
  $('shop-image-dialog').addEventListener('click',event=>{if(event.target===$('shop-image-dialog'))$('shop-image-dialog').close();});
  $('checkout-form').addEventListener('submit',submit);
  init();
})();
