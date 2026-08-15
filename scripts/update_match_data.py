#!/usr/bin/env python3
import json, os, urllib.parse, urllib.request
from datetime import datetime, date, timezone
from pathlib import Path
SITE_ID=9958
TOKEN=os.environ.get("PLAY_CRICKET_API_TOKEN","").strip()
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"/"data"/"matches.json"
def get_json(endpoint,params):
    p=dict(params);p["site_id"]=SITE_ID;p["api_token"]=TOKEN
    url="https://www.play-cricket.com/api/v2/"+endpoint+"?"+urllib.parse.urlencode(p)
    with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"LindsellCC-Website/1.1"}),timeout=30) as r:return json.load(r)
def d(s):
    try:return datetime.strptime(s,"%d/%m/%Y").date()
    except:return None
def name(club,team):
    club=(club or "").strip();team=(team or "").strip()
    return f"{club} {team}".strip()
def base(m):
    return {"id":m.get("id"),"match_date":m.get("match_date"),"match_time":m.get("match_time"),"ground_name":m.get("ground_name") or "","home_name":name(m.get("home_club_name"),m.get("home_team_name")),"away_name":name(m.get("away_club_name"),m.get("away_team_name")),"competition_type":m.get("competition_type") or "","match_type":m.get("match_type") or ""}
def result(m):
    x=base(m);x["result_description"]=m.get("result_description") or ""
    teams={str(m.get("home_team_id")):x["home_name"],str(m.get("away_team_id")):x["away_name"]}
    inns=[]
    for i in m.get("innings") or []:
        runs=str(i.get("runs") or "");wk=str(i.get("wickets") or "");ov=str(i.get("overs") or "")
        sc=runs+((f"/{wk}") if wk and wk!="10" else (" all out" if wk=="10" else ""))+((f" ({ov})") if ov else "")
        inns.append({"team_name":teams.get(str(i.get("team_batting_id")),"Team"),"score":sc.strip()})
    x["innings"]=inns;return x
def main():
    if not TOKEN:raise SystemExit("PLAY_CRICKET_API_TOKEN GitHub secret is missing.")
    today=date.today();fixtures=[];results=[]
    for season in [today.year,today.year+1]:
        try:fixtures+=(get_json("matches.json",{"season":season}).get("matches") or [])
        except Exception as e:print("fixtures",season,e)
        try:results+=(get_json("result_summary.json",{"season":season}).get("result_summary") or [])
        except Exception as e:print("results",season,e)
    fixtures=list({str(m.get("id")):m for m in fixtures if m.get("id")}.values())
    results=list({str(m.get("id")):m for m in results if m.get("id")}.values())
    up=[m for m in fixtures if d(m.get("match_date")) and d(m.get("match_date"))>=today];up.sort(key=lambda m:(d(m.get("match_date")),m.get("match_time") or ""))
    done=[m for m in results if d(m.get("match_date")) and d(m.get("match_date"))<=today and (m.get("result_description") or m.get("result"))];done.sort(key=lambda m:(d(m.get("match_date")),m.get("match_time") or ""),reverse=True)
    payload={"generated_at":datetime.now(timezone.utc).isoformat(),"season":today.year,"next_fixture":base(up[0]) if up else None,"latest_result":result(done[0]) if done else None,"upcoming":[base(m) for m in up[:10]],"recent_results":[result(m) for m in done[:10]]}
    OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
if __name__=="__main__":main()
