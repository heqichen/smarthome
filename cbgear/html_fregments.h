
static const char htmlHeader1[] PROGMEM = {
"<!doctype html><html lang='cn'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Cooboc Smart Setup</title><meta name='description' content='Cooboc Smart Device Setup'><meta name='author' content='HE Qichen'>"
};

static const char htmlHeader2[] PROGMEM = {
"<meta http-equiv='refresh' content='5; URL=/'>"
};

static const char htmlHeader3[] PROGMEM = {
"<style>*{margin:2px}</style></head><body><h1>Cooboc Smart Device Setup</h1>"
};

static const char htmlSetupBody1[] PROGMEM = {
"ID:<b>CoobocSmart_"
};

static const char htmlSetupBody2[] PROGMEM = {
"</b><br><form action='/set' method='POST' id='form'><label for='s'>SSID:</label><input name='s' type='text'><br><label for='p'>Password:</label><input name='p' type='text'><br><input id='p' type='submit' value='Submit'></form><script lang='text/javascript'>var n,s=['None','1-Button','2-Button','3-Button','4-Button','Slot','Human Existence Sensor','PIR Sensor','Water Sensor','Door Sensor'];d=document,f=(n,e,t)=>{n.setAttribute(e,t)},g=n=>d.createElement(n),p=d.getElementById('p'),h=n=>{p.parentNode.insertBefore(n,p)};for(var i=0;i<s.length;++i)n=g('input'),f(n,'type','radio'),f(n,'id',i),f(n,'name','t'),f(n,'value',i),h(n),n=g('label'),f(n,'for',i),n.innerText=s[i],h(n),h(g('br'));</script></body></html>"
};

