#!/usr/bin/env python3
"""Generate ../../neon-glass.css from neon-glass.src.css (run: python3 tools/neon-glass/build.py).

Every selector is prefixed with #ng#ng (three ID selectors = specificity 3,0,0) so the
new skin wins over the legacy stylesheets that use one ID plus several classes and !important.
"""
import os,re,sys
here=os.path.dirname(os.path.abspath(__file__))
src=sys.argv[1] if len(sys.argv)>1 else os.path.join(here,'neon-glass.src.css')
dst=sys.argv[2] if len(sys.argv)>2 else os.path.join(here,'..','..','neon-glass.css')
css=open(src,encoding='utf-8').read()
P='#ng#ng#ng'
def prefix_sel(sel):
    sel=sel.strip()
    if not sel: return sel
    if sel=='html' or sel.startswith('html'):
        return 'html'+'#ng#ng#ng'+sel[4:]
    if sel=='body':
        return P+' body'
    return P+' '+sel
out=[];i=0;n=len(css)
depth_stack=[]   # 'media' or 'rule'
buf=''
def flush_header(h):
    h=h.strip()
    if h.startswith('@') or h.startswith(':root'):
        return h
    return ', '.join(prefix_sel(s) for s in split_selectors(h))
def split_selectors(h):
    parts=[];d=0;cur=''
    for ch in h:
        if ch in '([': d+=1
        if ch in ')]': d-=1
        if ch==',' and d==0: parts.append(cur);cur=''
        else: cur+=ch
    parts.append(cur);return parts
res='';i=0
while i<n:
    # copy comments and @import verbatim
    if css.startswith('/*',i):
        j=css.index('*/',i)+2;res+=css[i:j];i=j;continue
    if css.startswith('@import',i):
        j=css.index(');',i)+2;res+=css[i:j];i=j;continue
    c=css[i]
    if c=='{':
        header=buf;buf=''
        # leading whitespace/newlines of header preserved separately
        lead=re.match(r'\s*',header).group(0)
        res+=lead+flush_header(header)+'{'
        depth_stack.append('media' if header.strip().startswith('@media') else 'rule')
        i+=1;continue
    if c=='}':
        # declaration text before } belongs to current rule
        res+=buf+'}';buf='';depth_stack.pop();i+=1;continue
    # accumulate: inside a rule body (top of stack == rule) emit directly
    if depth_stack and depth_stack[-1]=='rule':
        res+=c;i+=1;continue
    buf+=c;i+=1
res+=buf
hdr="/* GENERATED from neon-glass.src.css: selectors carry the #ng#ng#ng prefix (needs id=\"ng\" on <html>). */\n"
open(dst,'w',encoding='utf-8').write(hdr+res)
print('ok',len(res))
