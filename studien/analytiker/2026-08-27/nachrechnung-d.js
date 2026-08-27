'use strict';
/* Analytiker 27.08.2026, Block D: unabhaengige Nachrechnung der 12 Protokolle vom
 * 26.08. Eigene Implementierung der Urteilsregeln (nicht der Maschinen-Code):
 * Schwelle, delta80, Urteil je Variante, tage80, bestesUrteil, Placebo-Pruefung. */
var fs = require('fs');
var path = require('path');
var DIR = path.join(__dirname, '..', '..', 'messmaschine', 'protokolle');

// Eigene Normalquantil-Naeherung: Acklam-unabhaengig, per Bisektion auf erf-Naeherung
function erfc(x){ // Numerical Recipes 6.2.2, |Fehler|<1.2e-7
  var z=Math.abs(x), t=2/(2+z);
  var ans=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x>=0?ans:2-ans;
}
function qnormUpper(p){ // z mit P(Z>z)=p, Bisektion
  var lo=0, hi=10;
  for(var i=0;i<200;i++){ var m=(lo+hi)/2; (erfc(m/Math.SQRT2)/2 > p) ? lo=m : hi=m; }
  return (lo+hi)/2;
}
var ALPHA=0.05, Z80=0.8416212;
var RANG=['widerlegt','bestaetigt','bestaetigt-aber-nullpunkt-verschoben','nicht-bestaetigt','nicht-entscheidbar','nicht-messbar'];

var dateien = fs.readdirSync(DIR).filter(function(f){return f.indexOf('2026-08-26')>=0;});
var fehler=0, geprueft=0, zeilen=[];
dateien.forEach(function(f){
  var p=JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8'));
  var schwelle=qnormUpper(ALPHA/Math.max(1,p.tests)/2);
  var placeboOk=true;
  if(p.placebo&&p.placebo.t!=null) placeboOk=Math.abs(p.placebo.tagesmittel)<=p.placebo.mde;
  var meineUrteile=[];
  p.ergebnisse.forEach(function(r,vi){
    var u=r.bestaetigung&&r.bestaetigung.ueberschuss; if(!u){meineUrteile.push('nicht-messbar');return;}
    var urteil;
    if(u.tage<30) urteil='nicht-messbar';
    else if(u.mde==null) urteil='nicht-messbar';
    else if(Math.abs(u.tagesmittel)<u.mde) urteil='nicht-entscheidbar';
    else if(u.t>=schwelle&&u.tagesmittel>0) urteil=placeboOk?'bestaetigt':'bestaetigt-aber-nullpunkt-verschoben';
    else if(u.t<=-schwelle) urteil='widerlegt';
    else urteil='nicht-bestaetigt';
    meineUrteile.push(urteil);
    // delta80 + tage80 gegen die Entscheidungs-Eintraege halten
    var en=(p.entscheidungen||[]).filter(function(e){return e.regel==='Urteil Variante '+r.variante;})[0];
    if(en&&en.ergebnis){
      geprueft++;
      var d80=(u.se>0)?(schwelle+Z80)*u.se:null;
      var dSoll=en.ergebnis.delta80;
      if(d80!=null&&dSoll!=null&&Math.abs(d80-dSoll)/dSoll>1e-4){fehler++;zeilen.push(f+' V'+r.variante+': delta80 '+d80+' statt '+dSoll);}
      var t80=null;
      if(u.tagesmittel>0&&u.se>0&&u.tage>=30){
        var sd=u.se*Math.sqrt(u.tage);
        t80=Math.ceil(Math.pow(schwelle+Z80,2)*sd*sd/(u.tagesmittel*u.tagesmittel));
      }
      var t80Soll=en.ergebnis.aussicht?en.ergebnis.aussicht.tage80:null;
      if((t80==null)!==(t80Soll==null)||(t80!=null&&Math.abs(t80-t80Soll)>1)){fehler++;zeilen.push(f+' V'+r.variante+': tage80 '+t80+' statt '+t80Soll);}
      if(en.ergebnis.urteil!==urteil){fehler++;zeilen.push(f+' V'+r.variante+': Urteil '+urteil+' statt '+en.ergebnis.urteil);}
    }
    if(p.urteile[vi]!==urteil){fehler++;zeilen.push(f+' V'+r.variante+': urteile[] '+urteil+' statt '+p.urteile[vi]);}
  });
  var bestes=RANG.filter(function(k){return meineUrteile.indexOf(k)>=0;})[0]||'nicht-messbar';
  if(bestes!==p.bestesUrteil){fehler++;zeilen.push(f+': bestesUrteil '+bestes+' statt '+p.bestesUrteil);}
  // Placebo selbst: |t| und Aufloesungs-Regel
  if(p.placebo&&p.placebo.t!=null&&!placeboOk){zeilen.push(f+': PLACEBO NICHT BESTANDEN (tagesmittel '+(p.placebo.tagesmittel*100).toFixed(4)+' Pp > mde '+(p.placebo.mde*100).toFixed(4)+' Pp)');fehler++;}
  zeilen.push('OK '+f+' Schwelle '+schwelle.toFixed(3)+' ('+p.tests+' Tests) Urteile ['+meineUrteile.join(', ')+'] bestes='+bestes+' placeboOk='+placeboOk);
});
zeilen.forEach(function(z){console.log(z);});
console.log('== Varianten mit Entscheidungs-Eintrag geprueft: '+geprueft+', Abweichungen: '+fehler);
