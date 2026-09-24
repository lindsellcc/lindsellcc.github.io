(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const api = `${window.LINDSELL_SITE_CONFIG.supabaseUrl}/functions/v1/club-shop`;
  const previewMode = new URLSearchParams(location.search).get('preview') === '1';
  const money = pennies => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(pennies / 100);
  let catalog, card, busy=false, locked=false;
  const quantity = p => Number($(`qty-${p.id}`)?.value || 0);
  const choiceId = (p,n,f) => `choice-${p.id}-${n}-${f.key}`;
  function chosen() {
    return catalog.products.filter(p=>quantity(p)>0).map(p=>({
      id:p.id,quantity:quantity(p),
      customisations:Array.from({length:quantity(p)},(_,n)=>Object.fromEntries(p.fields.map(f=>{
        const input=$(choiceId(p,n,f));
        return [f.key,f.kind==='checkbox' ? input?.checked===true : (input?.value || '').trim()];
      })))
    }));
  }
  function total() {
    return chosen().reduce((sum,item)=>{
      const p=catalog.products.find(p=>p.id===item.id);
      return sum+item.quantity*p.pricePence+item.customisations.reduce((extra,c)=>extra+p.fields.filter(f=>f.kind==='checkbox'&&c[f.key]).reduce((n,f)=>n+f.pricePence,0),0);
    },0);
  }
  const error = message => { $('payment-error').textContent=message; $('payment-error').hidden=!message; };
  const setBusy = value => { busy=value; $('pay-button').disabled=value||locked||!card||!total(); $('pay-button').textContent=value?'Processing payment…':total()?`Pay ${money(total())}`:'Choose items'; };
  function productImage(p) {
    if (!p.image) return null;
    const img=document.createElement('img'); img.src=p.image; img.alt=p.name; img.loading='lazy'; img.className='shop-product-image';
    return img;
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
      for (const c of item.customisations) for (const f of p.fields.filter(f=>f.kind==='checkbox'&&c[f.key])) {
        const extra=document.createElement('div'); extra.className='shop-summary-line';
        const text=document.createElement('span'); text.textContent=f.label;
        const cost=document.createElement('strong'); cost.textContent=money(f.pricePence);
        extra.append(text,cost); lines.append(extra);
      }
    }
    $('order-total').textContent=money(total()); setBusy(busy);
  }
  function renderCustomisations() {
    const old={};
    for (const input of $('customisations').querySelectorAll('[data-choice]')) old[input.id]=input.type==='checkbox'?input.checked:input.value;
    const container=$('customisations'); container.replaceChildren();
    for (const p of catalog.products.filter(p=>quantity(p)>0&&p.fields.length)) {
      for (let n=0;n<quantity(p);n++) {
        const group=document.createElement('section'); group.className='shop-guest';
        const title=document.createElement('h4'); title.textContent=`${p.name} ${n+1}`; group.append(title);
        for (const f of p.fields) {
          const label=document.createElement('label'); label.textContent=f.label+(f.kind==='checkbox'?` (+${money(f.pricePence)})`:'');
          const id=choiceId(p,n,f); let input;
          if (f.kind==='select') {
            input=document.createElement('select'); const blank=document.createElement('option'); blank.value=''; blank.textContent='Select one'; input.append(blank);
            for (const value of f.choices) { const option=document.createElement('option'); option.value=value; option.textContent=value; input.append(option); }
            input.required=true;
          } else {
            input=document.createElement('input'); input.type=f.kind==='checkbox'?'checkbox':'text';
            if (f.kind==='text') { input.maxLength=100; input.required=true; input.autocomplete='off'; }
            else label.classList.add('shop-check');
          }
          input.id=id; input.dataset.choice=''; if (old[id]!==undefined) { if (f.kind==='checkbox') input.checked=old[id]; else input.value=old[id]; }
          input.addEventListener('change',renderOrder); label.append(input); group.append(label);
        }
        container.append(group);
      }
    }
    renderOrder();
  }
  function renderProducts() {
    const list=$('product-list'); list.replaceChildren();
    for (const p of catalog.products) {
      const row=document.createElement('div'); row.className='shop-product'+(p.available?'':' shop-product-unavailable');
      const detail=document.createElement('div');
      const name=document.createElement('strong'); name.textContent=p.name;
      const description=document.createElement('p'); description.textContent=p.description||'';
      const price=document.createElement('span'); price.className='shop-price'; price.textContent=p.available?money(p.pricePence):'Currently unavailable';
      const copy=document.createElement('div'); copy.append(name,description,price);
      detail.className='shop-product-info';
      const image=productImage(p); if(image) detail.append(image);
      detail.append(copy);
      const select=document.createElement('select'); select.id=`qty-${p.id}`; select.setAttribute('aria-label',`Quantity: ${p.name}`); select.disabled=!p.available;
      for(let n=0;n<=(p.available?p.maxQuantity:0);n++){const option=document.createElement('option');option.value=n;option.textContent=n;select.append(option);}
      select.addEventListener('change',renderCustomisations);
      const qtyLabel=document.createElement('label');qtyLabel.className='shop-quantity';qtyLabel.textContent='Quantity';qtyLabel.append(select);
      row.append(detail,qtyLabel); list.append(row);
    }
    renderCustomisations();
  }
  function renderPreview() {
    const list=$('shop-preview-products'); list.replaceChildren();
    for(const p of catalog.products){
      const card=document.createElement('div'); card.className='shop-preview-item';
      const name=document.createElement('strong'); name.textContent=p.name;
      const price=document.createElement('span'); price.textContent=p.pricePence?`${money(p.pricePence)} guide price`:'Price to be confirmed';
      const image=productImage(p);if(image)card.append(image);
      card.append(name,price);list.append(card);
    }
  }
  async function loadSquare(sandbox) {
    const script=document.createElement('script'); script.src=sandbox?'https://sandbox.web.squarecdn.com/v1/square.js':'https://web.squarecdn.com/v1/square.js';
    await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;document.head.append(script);});
  }
  async function init() {
    try {
      try {
        const response=await fetch(api,{cache:'no-store'});
        if(!response.ok) throw new Error('Shop API unavailable');
        catalog=await response.json();
      } catch {
        const preview=await fetch('assets/data/shop-preview.json?v=1.3.25',{cache:'no-store'});
        if(!preview.ok) throw new Error('The shop is temporarily unavailable. Please try again later.');
        catalog=await preview.json();catalog.salesOpen=false;
      }
      if(previewMode){
        const preview=await fetch('assets/data/shop-preview.json?v=1.3.25',{cache:'no-store'});
        if(!preview.ok) throw new Error('The interactive preview is temporarily unavailable.');
        catalog=await preview.json();catalog.salesOpen=false;
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
        $('shop-closed-copy').textContent='Select items and meal choices below to review the order flow. Prices are shown for review; no details are collected and payment is disabled.';
        $('shop-badge').textContent='Review mode · checkout closed';
        $('booking-panel').hidden=true;$('payment-panel').hidden=true;
        $('order-heading').textContent='Your order preview';
        $('order-help').textContent='No order will be placed from this preview.';
        document.body.classList.add('shop-preview-mode');
        renderProducts();$('shop-open').hidden=false;return;
      }
      $('shop-badge').textContent='Secure card payment by Square';
      renderProducts();$('shop-open').hidden=false;
      await loadSquare(catalog.sandbox);
      if(!window.Square) throw new Error('The secure card form could not load. Please refresh the page.');
      const payments=window.Square.payments(catalog.applicationId,catalog.locationId);
      card=await payments.card();await card.attach('#card-container');renderOrder();
    } catch(e){$('shop-loading').hidden=true;$('shop-message').hidden=false;$('shop-message').textContent=e.message||'The shop is temporarily unavailable.';$('shop-open').hidden=true;}
  }
  async function submit(event) {
    event.preventDefault();if(busy||locked||!card)return;error('');
    if(!$('checkout-form').reportValidity())return;
    if(!total()){error('Please choose at least one item.');return;}
    setBusy(true);
    const name=$('buyer-name').value.trim(),email=$('buyer-email').value.trim(),checkoutId=crypto.randomUUID();
    let submitted=false;
    try {
      const quote=total();
      const token=await card.tokenize({amount:(quote/100).toFixed(2),currencyCode:'GBP',intent:'CHARGE',customerInitiated:true,sellerKeyedIn:false,
        billingContact:{givenName:name.split(/\s+/)[0],familyName:name.split(/\s+/).slice(1).join(' ')||undefined,email,countryCode:'GB'}});
      if(token.status!=='OK')throw new Error('Card details could not be verified. Please check them and try again.');
      submitted=true;
      const response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        checkoutId,catalogRevision:catalog.revision,quotedTotal:quote,sourceId:token.token,items:chosen(),
        buyerName:name,email,phone:$('buyer-phone').value.trim(),dietary:$('dietary').value.trim()
      })});
      const result=await response.json();submitted=false;
      if(!response.ok){if(result.uncertain){locked=true;error(`Your payment status is being checked. Please do not pay again. Contact info@lindsellcc.co.uk with reference ${checkoutId}.`);return;}throw new Error(result.error||'Payment could not be completed.');}
      $('shop-content').hidden=true;$('shop-success').hidden=false;
      $('booking-reference').textContent=`Order reference: ${checkoutId}`;
      if(result.receiptUrl&&/^https:\/\//.test(result.receiptUrl)){$('receipt-link').href=result.receiptUrl;$('receipt-link').hidden=false;}
      $('shop-success').focus();
    } catch(e){if(submitted){locked=true;error(`The connection dropped while checking payment. Please do not pay again. Contact info@lindsellcc.co.uk with reference ${checkoutId}.`);}else error(e.message||'Payment could not be completed. Please try again.');}
    finally{setBusy(false);}
  }
  $('checkout-form').addEventListener('submit',submit);
  init();
})();
