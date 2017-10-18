EXEC = glucose
DEPDIR    = mtl utils core
MROOT = $(PWD)/..

include $(MROOT)/mtl/template.mk

EMSCRIPTEN_OPTS = -s WASM=1 -s USE_ZLIB=1 -s INVOKE_RUN=0 -s ALLOW_MEMORY_GROWTH=1 -s ASYNCIFY=1 -s FORCE_FILESYSTEM=1 -s EXPORTED_FUNCTIONS="['_cancel','_main']" -O3

# special configuration for wasm target
xwsolve.js:	EXEC=$@
xwsolve.js:	CXX=em++
xwsolve.js:	CFLAGS+= $(EMSCRIPTEN_OPTS)
xwsolve.js:	LFLAGS= $(EMSCRIPTEN_OPTS)
xwsolve.js:	$(COBJS)
	@echo Linking: "$@ ( $(foreach f,$^,$(subst $(MROOT)/,,$f)) )"
	@$(CXX) $^ $(LFLAGS) -o $@
