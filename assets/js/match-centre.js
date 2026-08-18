
(function(){
  const cfg=window.LINDSELL_SITE_CONFIG||{};
  const DATA_URL="assets/data/matches.json";
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function displayDate(date,time){
    if(!date) return "Date TBC";
    const p=String(date).split("/");
    let d=null;
    if(p.length===3) d=new Date(Number(p[2]),Number(p[1])-1,Number(p[0]));
    if(!d||Number.isNaN(d.getTime())) return [date,time].filter(Boolean).join(" • ");
    const dt=new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).format(d);
    return [dt,time].filter(Boolean).join(" • ");
  }
  const fixtureName=m=>`${m.home_name||"Home"} v ${m.away_name||"Away"}`;
  const scorecardUrl=id=>id?`${cfg.playCricketSiteUrl}/website/results/${id}`:"#";

  function parseScore(score){
    const s=String(score||"").trim();
    const runsMatch=s.match(/^(\d+)/);
    if(!runsMatch) return null;
    const runs=Number(runsMatch[1]);

    const wicketsMatch=s.match(/\/(\d+)/);
    let wickets=null;
    if(wicketsMatch){
      wickets=Number(wicketsMatch[1]);
    }else if(/all out/i.test(s)){
      wickets=10;
    }

    return {runs,wickets};
  }

  function shortTeamName(name){
    let n=String(name||"").trim();
    n=n.replace(/\s*-\s*/g," ");
    n=n.replace(/\s+/g," ");
    return n;
  }

  function cricketResultLine(m){
    const original=String(m.result_description||"").trim();
    const status=original.toLowerCase();

    // Preserve special/non-completed states exactly as Play-Cricket provides them.
    if(!original) return "";
    if(
      status.includes("match in progress") ||
      status.includes("cancelled") ||
      status.includes("canceled") ||
      status.includes("abandoned") ||
      status.includes("no result") ||
      status.includes("tied") ||
      status.includes("tie")
    ){
      return original;
    }

    if(!Array.isArray(m.innings) || m.innings.length < 2){
      return original;
    }

    const byTeam={};
    m.innings.forEach(i=>{
      byTeam[i.team_name]=parseScore(i.score);
    });

    const home=byTeam[m.home_name];
    const away=byTeam[m.away_name];
    if(!home || !away) return original;

    const homeWon=home.runs>away.runs;
    const awayWon=away.runs>home.runs;
    if(!homeWon && !awayWon) return original;

    const winnerName=shortTeamName(homeWon?m.home_name:m.away_name);

    // Infer whether the winner batted second from the innings order.
    const secondInningsTeam=m.innings[1] && m.innings[1].team_name;
    const winnerBattedSecond=secondInningsTeam === (homeWon?m.home_name:m.away_name);

    if(winnerBattedSecond){
      const winnerScore=homeWon?home:away;
      if(winnerScore.wickets!==null){
        const wicketsRemaining=Math.max(0,10-winnerScore.wickets);
        if(wicketsRemaining>0){
          return `${winnerName} won by ${wicketsRemaining} wicket${wicketsRemaining===1?"":"s"}`;
        }
      }
    }

    const margin=Math.abs(home.runs-away.runs);
    if(margin>0){
      return `${winnerName} won by ${margin} run${margin===1?"":"s"}`;
    }

    return original;
  }

  async function loadData(){
    const r=await fetch(`${DATA_URL}?v=${Date.now()}`,{cache:"no-store"});
    if(!r.ok) throw new Error("match-data");
    return await r.json();
  }

  function home(data){
    const n=document.querySelector("[data-next-fixture]");
    const l=document.querySelector("[data-latest-result]");
    if(n){
      const m=data.next_fixture;
      n.innerHTML=m?`<div class="match-label">Next fixture</div><h3>${esc(fixtureName(m))}</h3><div class="match-meta"><span>${esc(displayDate(m.match_date,m.match_time))}</span><span>${esc(m.ground_name||"Venue TBC")}</span></div><div class="actions"><a class="btn primary" href="${esc(scorecardUrl(m.id))}" target="_blank" rel="noopener">Fixture details</a></div>`:`<div class="match-label">Next fixture</div><h3>No upcoming fixture found</h3>`;
    }
    if(l){
      const m=data.latest_result;
      if(m){
        const inn=(m.innings||[]).map(i=>`<span class="innings-chip">${esc(i.team_name)} ${esc(i.score)}</span>`).join("");
        l.innerHTML=`<div class="match-label">Latest result</div><h3>${esc(fixtureName(m))}</h3><div class="match-meta"><span>${esc(displayDate(m.match_date,m.match_time))}</span></div><div class="match-result">${esc(cricketResultLine(m)||"Result available")}</div><div class="innings-list">${inn}</div><div class="actions"><a class="btn primary" href="${esc(scorecardUrl(m.id))}" target="_blank" rel="noopener">View scorecard</a></div>`;
      }else l.innerHTML=`<div class="match-label">Latest result</div><h3>No recent result found</h3>`;
    }
    const note=document.querySelector("[data-match-updated]");
    if(note&&data.generated_at) note.textContent=`Match data refreshed ${new Date(data.generated_at).toLocaleString("en-GB")}.`;
  }

  function fixtures(data){
    const up=document.querySelector("[data-upcoming-list]");
    const rec=document.querySelector("[data-results-list]");
const row = m => {

  let homeLabel = m.home_name || "Home";
  let awayLabel = m.away_name || "Away";
  let resultLine = "";

  if (m.result_description && Array.isArray(m.innings) && m.innings.length) {

    const scores = {};

    m.innings.forEach(i => {
      scores[i.team_name] = i.score;
    });

    const homeScore = scores[m.home_name] || "";
    const awayScore = scores[m.away_name] || "";

    homeLabel = `${m.home_name}${homeScore ? " " + homeScore : ""}`;
    awayLabel = `${m.away_name}${awayScore ? " " + awayScore : ""}`;

    resultLine = cricketResultLine(m);
  }

  return `
    <div class="fixture-row">

      <div class="fixture-date">
        ${esc(displayDate(m.match_date,m.match_time))}
      </div>

      <div>

        <div class="fixture-teams">
          <span class="fixture-home-team">${esc(homeLabel)}</span> <span class="fixture-versus">v</span> <span class="fixture-away-team">${esc(awayLabel)}</span>
        </div>

        ${
          resultLine
            ? `<div class="fixture-result">${esc(resultLine)}</div>`
            : ""
        }

        <div class="fixture-ground">
          ${esc(m.ground_name || "Venue TBC")}
        </div>

      </div>

      <a
        href="${esc(scorecardUrl(m.id))}"
        target="_blank"
        rel="noopener"
      >
        ${m.result_description ? "Scorecard" : "Details"} →
      </a>

    </div>
  `;
};
    if(up) up.innerHTML=(data.upcoming||[]).length?data.upcoming.map(row).join(""):`<div class="notice">No upcoming fixtures currently found.</div>`;
    if(rec) rec.innerHTML=(data.recent_results||[]).length?data.recent_results.map(row).join(""):`<div class="notice">No recent results currently found.</div>`;
  }

  async function detectLive(){
    const b=document.querySelector("[data-live-now]");
    if(!b) return;
    try{
      const r=await fetch(`${cfg.supabaseUrl}/rest/v1/live_scoreboard?id=eq.1&select=fixture_id,score,updated_at`,{cache:"no-store",headers:{apikey:cfg.supabasePublishableKey,Authorization:`Bearer ${cfg.supabasePublishableKey}`}});
      if(!r.ok) return;
      const row=(await r.json())[0];
      if(!row) return;
      const age=(Date.now()-new Date(row.updated_at).getTime())/1000;
      const score=row.score||{};
      const state=String(score.state||"").toLowerCase();
      if(age>14400||!row.fixture_id||!["waiting","live"].includes(state)){b.classList.remove("visible");return;}
      b.classList.add("visible");
      const title=b.querySelector("[data-live-title]");
      const copy=b.querySelector("[data-live-copy]");
      const link=b.querySelector("[data-live-link]");
      if(title) title.textContent=state==="waiting"?"Broadcast prepared — play waiting to commence":"Lindsell CC is live";
      if(copy) copy.textContent=`${score.homeTeam||"Lindsell CC"} v ${score.awayTeam||"Opposition"}`;
      if(link) link.href=cfg.oldLiveScoreUrl;
    }catch(e){}
  }

  loadData().then(data=>{home(data);fixtures(data)}).catch(()=>{
    const n=document.querySelector("[data-match-updated]");
    if(n) n.textContent="Automatic match data is not available yet. Use Play-Cricket links below.";
  });
  detectLive(); setInterval(detectLive,30000);
})();
