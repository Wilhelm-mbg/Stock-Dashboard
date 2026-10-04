#!/usr/bin/env python3
"""Ken French: Momentum Big-High / Hi PRIOR vs. Markt. Liest entpackte CSVs aus Verzeichnis argv[1]."""
import sys,re,json,csv,os
D=sys.argv[1]
def sect(path,title,ncols):
    L=open(path,errors='replace').read().split('\n'); out={}; on=False
    for l in L:
        if l.strip().startswith(title): on=True; continue
        if on:
            m=re.match(r'^\s*(\d{6}),(.*)$',l)
            if m: out[m.group(1)]=[float(x) for x in m.group(2).split(',')][:ncols]
            elif out: break
    return out
f6=D+'/6_Portfolios_ME_Prior_12_2_CSV/6_Portfolios_ME_Prior_12_2.csv'
f10=D+'/10_Portfolios_Prior_12_2_CSV/10_Portfolios_Prior_12_2.csv'
ff=D+'/F-F_Research_Data_Factors_CSV/F-F_Research_Data_Factors.csv'
big_vw=sect(f6,'Average Value Weighted Returns -- Monthly',6)
big_ew=sect(f6,'Average Equal Weighted Returns -- Monthly',6)
n6=sect(f6,'Number of Firms in Portfolios',6)
hi_vw=sect(f10,'Value Weight Returns -- Monthly',10)
hi_ew=sect(f10,'Average Equal Weighted Returns -- Monthly',10)
n10=sect(f10,'Number of Firms in Portfolios',10)
# Faktor-Datei: erste Tabelle ab Kopfzeile
fac={}
for l in open(ff,errors='replace'):
    m=re.match(r'^\s*(\d{6}),(.*)$',l)
    if m: fac[m.group(1)]=[float(x) for x in m.group(2).split(',')]
series={
 'BigHigh_VW':{k:v[5] for k,v in big_vw.items()},
 'BigHigh_EW':{k:v[5] for k,v in big_ew.items()},
 'HiPRIOR_VW':{k:v[9] for k,v in hi_vw.items()},
 'HiPRIOR_EW':{k:v[9] for k,v in hi_ew.items()},
 'Markt_MktRF_plus_RF':{k:v[0]+v[3] for k,v in fac.items()},
}
firms={'BigHigh_Firmen':{k:v[5] for k,v in n6.items()},'HiPRIOR_Firmen':{k:v[9] for k,v in n10.items()}}
last=min(max(s) for s in series.values()); first='201701'
months=sorted(m for m in series['Markt_MktRF_plus_RF'] if first<=m<=last)
for n,s in series.items():
    for m in months: assert m in s and s[m]>-99, (n,m)
def stats(s,ms):
    v=100.;pk=100.;dd=0.;ddm=None;rets=[]
    for m in ms:
        v*=1+s[m]/100;rets.append(s[m])
        if v>pk:pk=v
        d=v/pk-1
        if d<dd:dd=d;ddm=m
    n=len(ms);ann=((v/100)**(12/n)-1)*100
    return dict(monate=n,endwert=round(v,2),gesamtertrag_pct=round(v-100,2),annualisiert_pct=round(ann,2),max_drawdown_monatsende_pct=round(dd*100,2),drawdown_tiefpunkt=ddm)
def win(a,b): return [m for m in months if a<=m<=b]
W={'A_201701_202109':win('201701','202109'),'B_202110_'+last:win('202110',last)}
lenA=len(W['A_201701_202109'])
b=win('202110',last)[:lenA]; W['B2_gleichlang_%s_%s'%(b[0],b[-1])]=b
res={'letzter_monat':last,'fenster':{k:[v[0],v[-1],len(v)] for k,v in W.items()},'ergebnis':{}}
for w,ms in W.items():
    res['ergebnis'][w]={n:stats(s,ms) for n,s in series.items()}
    res['ergebnis'][w]['Firmen_BigHigh_Anfang_Ende_Mittel']=[firms['BigHigh_Firmen'][ms[0]],firms['BigHigh_Firmen'][ms[-1]],round(sum(firms['BigHigh_Firmen'][m] for m in ms)/len(ms),1)]
    res['ergebnis'][w]['Firmen_HiPRIOR_Anfang_Ende_Mittel']=[firms['HiPRIOR_Firmen'][ms[0]],firms['HiPRIOR_Firmen'][ms[-1]],round(sum(firms['HiPRIOR_Firmen'][m] for m in ms)/len(ms),1)]
# Auffaelligkeit: groesste Einzelmonate
res['auffaellig']={n:sorted(((s[m],m) for m in months),reverse=True)[:3] for n,s in series.items() if n.startswith('Hi') or n.startswith('Big')}
json.dump(res,open('02-french.json','w'),indent=1,ensure_ascii=False)
with open('02-french-monatsrenditen.csv','w',newline='') as f:
    w=csv.writer(f);w.writerow(['monat']+list(series)+list(firms))
    for m in months: w.writerow([m]+[series[n][m] for n in series]+[firms[n][m] for n in firms])
print(json.dumps(res,indent=1,ensure_ascii=False))
