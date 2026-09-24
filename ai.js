// VORTEX REAL AI - No more fake fallback
const VORTEX_AI = {
  async ask(question){
    let key = localStorage.getItem('vortex_key');
    if(!key){
      key = prompt('Paste your OpenAI key once (sk-proj-...):');
      if(!key) return "No key provided.";
      localStorage.setItem('vortex_key', key);
    }
    try{
      const res = await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{
          'Authorization':'Bearer '+key,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          model:'gpt-4o-mini',
          messages:[{role:'system',content:'You are VORTEX AI, intelligent, luxurious, helpful assistant for VORTEX app.'},{role:'user',content:question}]
        })
      });
      const data = await res.json();
      if(data.error) return "Error: "+data.error.message+" (check key/balance)";
      return data.choices[0].message.content;
    }catch(e){
      return "Connection error: "+e.message;
    }
  }
};

// Hook to your UI - finds input/output
document.addEventListener('DOMContentLoaded',()=>{
  const input = document.querySelector('#ai-input, #msg');
  const out = document.querySelector('#ai-output, #out,.chat');
  const btn = document.querySelector('#ai-send, button');
  if(btn) btn.onclick = async ()=>{
    const q = input.value; if(!q) return;
    out.innerHTML += `<div>YOU: ${q}</div>`;
    const ans = await VORTEX_AI.ask(q);
    out.innerHTML += `<div>AI: ${ans}</div>`;
    input.value='';
  };
});
