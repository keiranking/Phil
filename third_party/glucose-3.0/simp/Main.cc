/*****************************************************************************************[Main.cc]
 Glucose -- Copyright (c) 2009, Gilles Audemard, Laurent Simon
				CRIL - Univ. Artois, France
				LRI  - Univ. Paris Sud, France
 
Glucose sources are based on MiniSat (see below MiniSat copyrights). Permissions and copyrights of
Glucose are exactly the same as Minisat on which it is based on. (see below).

---------------

Copyright (c) 2003-2006, Niklas Een, Niklas Sorensson
Copyright (c) 2007-2010, Niklas Sorensson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
**************************************************************************************************/

#include <errno.h>

#include <signal.h>
#include <zlib.h>
#include <sys/resource.h>

#include <fcntl.h>
#include <sys/stat.h>
#include <algorithm>

#include "utils/System.h"
#include "utils/ParseUtils.h"
#include "utils/Options.h"
#include "core/Dimacs.h"
#include "simp/SimpSolver.h"

using namespace Glucose;

//=================================================================================================

char* readEntireFile(const char* filename, size_t *size_out) {
    int fd = open(filename, O_RDONLY);
    if (fd < 0) {
        printf("error reading %s\n", filename);
        exit(1);
    }
    struct stat statbuf;
    fstat(fd, &statbuf);
    size_t size = (size_t)statbuf.st_size;
    //printf("file size = %d\n", (int)size);
    *size_out = size;
    char* result = new char[size];
    read(fd, result, size);
    close(fd);
    return result;
}

class Wordlist {
  public:
    /* Note: the provided buffer must outlive the wordlist; we retain references into it */
    void load(char* buf, size_t size) {
        for (size_t i = 0; i < size;) {
            size_t wordlen = 0;
            while (i + wordlen < size && buf[i + wordlen] != '\n') {
                wordlen++;
            }
            if (i + wordlen == size) break;  // partial line, shouldn't happen
            while (words.size() <= wordlen) {
                words.push();
            }
            // TODO: rejection of words containing non-alpha, conversion to uppercase
            words[wordlen].push(buf + i);
            i += wordlen + 1;
        }
    }

    void get_matching(const char* pattern, size_t len, vec<char*>* result) {
        result->clear();
        if (len > words.size()) {
            return;
        }
        vec<char*>& w = words[len];  // list of words of the given len
        size_t i;
        for (i = 0; i < len; i++) {
            if (pattern[i] != ' ') break;
        }
        if (i == len) {
            w.copyTo(*result);
            return;
        }
        for (size_t j = 0; j < w.size(); j++) {
            char* cand = w[j];
            for (i = 0; i < len; i++) {
                if (pattern[i] != ' ' && pattern[i] != cand[i]) break;
            }
            if (i == len) {
                result->push(cand);
            }
        }
    }
  private:
    vec<vec<char*> > words;
};

class Coord {
  public:
    Coord(int x, int y) : x(x), y(y) { }
    int x, y;
};

class Word {
  public:
    vec<Coord> locs;
    size_t filled_count;
    size_t dist;
};

bool char_in_str(char c, const char* s, size_t len) {
    for (size_t i = 0; i < len; i++) {
        if (s[i] == c) return true;
    }
    return false;
}

class Grid {
  public:
    void load(char* buf, size_t size) {
        data = buf;
        for (size_t i = 0; i < size;) {
            size_t linelen = 0;
            while (i + linelen < size && buf[i + linelen] != '\n') {
                linelen++;
            }
            if (i + linelen == size) break;  // partial line, shouldn't happen
            cols = linelen;
            rows++;
            i += linelen + 1;
        }
        across.growTo(cols * rows, -1);
        down.growTo(cols * rows, -1);
    }

    /* Analyzes the grid for words */
    void analyze() {
        for (int y = 0; y < rows; y++) {
            for (int x = 0; x < cols; x++) {
                if (get(x, y) != '.') {
                    if (x == 0 || get(x - 1, y) == '.') {
                        int end = x + 1;
                        while (end < cols && get(end, y) != '.') end++;
                        vec<Coord> locs;
                        for (int xx = x; xx < end; xx++) {
                            locs.push(Coord(xx, y));
                        }
                        add_word(locs, false);
                    }
                    if (y == 0 || get(x, y - 1) == '.') {
                        int end = y + 1;
                        while (end < rows && get(x, end) != '.') end++;
                        vec<Coord> locs;
                        for (int yy = y; yy < end; yy++) {
                            locs.push(Coord(x, yy));
                        }
                        add_word(locs, true);
                    }
                }
            }
        }
    }

    void add_word(vec<Coord>& locs, bool is_down) {
        int w_ix = (int)words.size();
        words.push();
        Word& w = words.last();
        w.filled_count = 0;
        for (size_t i = 0; i < locs.size(); i++) {
            Coord c = locs[i];
            if (get(c.x, c.y) != ' ') {
                w.filled_count++;
            }
            if (is_down) {
                down[c.y * cols + c.x] = w_ix;
            } else {
                across[c.y * cols + c.x] = w_ix;
            }
        }
        w.dist = w.filled_count != 0 ? 0 : 9999;
        locs.moveTo(w.locs);
    }

    // Compute distance from partially or fully filled word for each word in grid
    void bfs() {
        vec<int> q;
        for (size_t i = 0; i < words.size(); i++) {
            if (words[i].dist == 0) {
                q.push(i);
            }
        }
        // Note: if q is empty, then grid consists only of unfilled words
        size_t ix = 0;
        while (ix < q.size()) {
            Word& w = words[q[ix++]];
            size_t dist = w.dist + 1;
            for (size_t j = 0; j < w.locs.size(); j++) {
                Coord loc = w.locs[j];
                size_t loc_ix = loc.y * cols + loc.x;
                if (dist < words[across[loc_ix]].dist) {
                    words[across[loc_ix]].dist = dist;
                    q.push(across[loc_ix]);
                }
                if (dist < words[down[loc_ix]].dist) {
                    words[down[loc_ix]].dist = dist;
                    q.push(down[loc_ix]);
                }
            }
        }
    }

    // max distance of all words in the grid
    size_t max_dist() const {
        size_t result = 0;
        for (size_t i = 0; i < words.size(); i++) {
            result = std::max(result, words[i].dist);
        }
        return result;
    }

    size_t dist_of_loc(Coord loc) const {
        size_t ix = loc.y * cols + loc.x;
        return std::min(words[across[ix]].dist, words[down[ix]].dist);
    }

    // reject words with uncommon letters in high-distance locations
    bool check_freq_constraint(vec<Coord>& locs, const char* word,
        int thresh1, int thresh2) const
    {
        const char *freq = "ETAOINSHRDLCUMWFGYPBVKJXQZ";
        for (size_t i = 0; i < locs.size(); i++) {
            if (dist_of_loc(locs[i]) == 1) {
                if (!char_in_str(word[i], freq, thresh1)) return false;
            } else if (dist_of_loc(locs[i]) >= 2) {
                if (!char_in_str(word[i], freq, thresh2)) return false;
            }
        }
        return true;
    }

    const char& operator [] (Coord c) const {
        return data[c.y * (cols + 1) + c.x];
    }
    char& operator [] (Coord c) {
        return data[c.y * (cols + 1) + c.x];
    }
    char get(int x, int y) {
        return data[y * (cols + 1) + x];
    }
    size_t cols = 0;
    size_t rows = 0;
    vec<Word> words;
  private:
    char* data;
    vec<int> across;  // index of across word at each loc
    vec<int> down;    // index of down word at each loc
};

void printStats(Solver& solver);

// Core fill algorithm; use 10000 for max_dist and max_recon to solve entire grid
// Return value is 0 on success, 20 if unsat
int fill_core(Wordlist& wl, char* puz, size_t puz_size, bool pre, int max_dist, int max_recon,
        int thresh1, int thresh2)
{
    Grid g;
    g.load(puz, puz_size);
    g.analyze();
    SimpSolver S;
    S.parsing = 1;
    if (!pre) {
        // Note: this interface changes with glucose 4
        S.eliminate(true);
    }

    /* create letter variables and "at most one" constraints */
    vec<int> letter_base;
    int v = 0;
    for (size_t y = 0; y < g.rows; y++) {
        for (size_t x = 0; x < g.cols; x++) {
            char c = g.get(x, y);
            if (c == ' ') {
                letter_base.push(v);
                for (int i = 0; i < 26; i++) {
                    S.newVar();
                }
                for (int i = 0; i < 25; i++) {
                    for (int j = i + 1; j < 26; j++) {
                        S.addClause(~mkLit(v + i), ~mkLit(v + j));
                    }
                }
                v += 26;
            } else {
                letter_base.push(-1);
            }
        }
    }

    g.bfs();
    size_t g_max_dist = g.max_dist();
    printf("max dist = %d\n", (int)g_max_dist);
    if (g_max_dist == 9999) {
        // empty grid
        max_dist = 10000;
    }
    if (g_max_dist < max_dist) {
        max_recon = 10000;
    }

    /* create word variables, word->letter constraints, and "at least one" constraints */
    const size_t MAX_WORD = 128;
    char pattern[MAX_WORD];
    vec<char*> matches;
    vec<Lit> lits; // used for building "at least one" word constraint
    assert(g.cols <= MAX_WORD && g.rows <= MAX_WORD);
    for (size_t i = 0; i < g.words.size(); i++) {
        Word& w = g.words[i];
        if (w.dist >= max_dist) continue;
        size_t len = w.locs.size();
        if (w.filled_count == len) continue;
        for (size_t j = 0; j < len; j++) {
            pattern[j] = g[w.locs[j]];
        }
        wl.get_matching(pattern, len, &matches);
        lits.clear();
        for (size_t j = 0; j < matches.size(); j++) {
            char* match = matches[j];
            if (!g.check_freq_constraint(w.locs, match, thresh1, thresh2)) continue;
            //printf("%.*s\n", len, matches[j]);
            S.newVar();
            lits.push(mkLit(v));
            for (size_t k = 0; k < len; k++) {
                Coord loc = w.locs[k];
                int base = letter_base[loc.y * g.cols + loc.x];
                if (base >= 0) {
                    S.addClause(~mkLit(v), mkLit(base + match[k] - 'A'));
                }
            }
            v++;
        }
        S.addClause_(lits);
    }

    /* solve and output */
    S.parsing = 0;
    S.verbosity = 0;
    S.verbEveryConflicts = 10000;
    S.showModel = false;
       if (S.verbosity > 0){
            printf("c |  Number of variables:  %12d                                                                   |\n", S.nVars());
            printf("c |  Number of clauses:    %12d                                                                   |\n", S.nClauses()); }
    //S.toDimacs("/tmp/dimacs");
    S.eliminate(true);
    vec<Lit> dummy;
    lbool ret = S.solveLimited(dummy);
    if (S.verbosity >= 1) {
        printStats(S);
    }
    size_t ix = 0;
    if (ret == l_True) {
        for (size_t y = 0; y < g.rows; y++) {
            for (size_t x = 0; x < g.cols; x++) {
                int base = letter_base[ix++];
                if (base >= 0 && g.dist_of_loc(Coord(x, y)) < max_recon) {
                    for (int z = 0; z < 26; z++) {
                        if (S.model[base + z] == l_True) {
                            puz[y * (g.cols + 1) + x] = 'A' + z;
                        }
                    }
                }
            }
        }
        return 0;
    } else {
        printf("UNSAT\n");
        return 20;
    }
}

// Iterate the fill core until grid is filled
int fill_iterative(Wordlist& wl, char* puz, size_t puz_size, bool pre,
        int thresh1, int thresh2)
{
    vec<char> save_puz(puz_size);
    memcpy(save_puz, puz, puz_size);
    int max_dist = 2;

    size_t iter = 0;
    while (true) {
        size_t i;
        for (i = 0; i < puz_size; i++) {
            if (puz[i] == ' ') break;
        }
        if (i == puz_size) {
            // successful fill
            return 0;
        }
        int status = fill_core(wl, puz, puz_size, pre, max_dist, 1, thresh1, thresh2);
        if (status != 0) {
            if (iter == 0) return status;
            // Got into a dead end, try a deeper initial search
            max_dist++;
            printf("restarting, max_dist = %d\n", max_dist);
            memcpy(puz, save_puz, puz_size);
            iter = 0;
        } else {
            iter++;
        }
    }
}

int main(int argc, char** argv) {
    IntOption    cpu_lim("MAIN", "cpu-lim","Limit on CPU time allowed in seconds.\n", INT32_MAX, IntRange(0, INT32_MAX));
    BoolOption   pre    ("MAIN", "pre",    "Completely turn on/off any preprocessing.", false);
    IntOption    thresh1("MAIN", "thresh1","Letter frequency threshold for distance 1", 26, IntRange(0, 26));
    IntOption    thresh2("MAIN", "thresh2","Letter frequency threshold for distance >=2", 26, IntRange(0, 26));

    // this is needed to set the defaults
    parseOptions(argc, argv, true);

        // Set limit on CPU-time:
    if (cpu_lim != INT32_MAX){
        rlimit rl;
        getrlimit(RLIMIT_CPU, &rl);
        if (rl.rlim_max == RLIM_INFINITY || (rlim_t)cpu_lim < rl.rlim_max){
            rl.rlim_cur = cpu_lim;
            if (setrlimit(RLIMIT_CPU, &rl) == -1)
                printf("c WARNING! Could not set resource limit: CPU-time.\n");
        } }

    if (argc < 3) {
        printf("usage: glucose wordlist puzzle\n");
        exit(1);
    }
    char* wl_fn = argv[1];
    char* puz_fn = argv[2];

    size_t wl_size;
    char* words = readEntireFile(wl_fn, &wl_size);
    Wordlist wl;
    wl.load(words, wl_size);
    size_t puz_size;
    char* puz = readEntireFile(puz_fn, &puz_size);
    int result = fill_iterative(wl, puz, puz_size, pre, thresh1, thresh2);
    if (result == 0) {
        int o_fd = open(puz_fn, O_WRONLY | O_TRUNC);
        if (o_fd >= 0) {
            write(o_fd, puz, puz_size);
        }
    }
    return result;
}

void printStats(Solver& solver)
{
    double cpu_time = cpuTime();
    double mem_used = 0;//memUsedPeak();
    printf("c restarts              : %" PRIu64 " (%" PRIu64 " conflicts in avg)\n", solver.starts,(solver.starts>0 ?solver.conflicts/solver.starts : 0));
    printf("c blocked restarts      : %" PRIu64 " (multiple: %" PRIu64 ") \n", solver.nbstopsrestarts,solver.nbstopsrestartssame);
    printf("c last block at restart : %" PRIu64 "\n",solver.lastblockatrestart);
    printf("c nb ReduceDB           : %lld\n", solver.nbReduceDB);
    printf("c nb removed Clauses    : %lld\n",solver.nbRemovedClauses);
    printf("c nb learnts DL2        : %lld\n", solver.nbDL2);
    printf("c nb learnts size 2     : %lld\n", solver.nbBin);
    printf("c nb learnts size 1     : %lld\n", solver.nbUn);

    printf("c conflicts             : %-12" PRIu64 "   (%.0f /sec)\n", solver.conflicts   , solver.conflicts   /cpu_time);
    printf("c decisions             : %-12" PRIu64 "   (%4.2f %% random) (%.0f /sec)\n", solver.decisions, (float)solver.rnd_decisions*100 / (float)solver.decisions, solver.decisions   /cpu_time);
    printf("c propagations          : %-12" PRIu64 "   (%.0f /sec)\n", solver.propagations, solver.propagations/cpu_time);
    printf("c conflict literals     : %-12" PRIu64 "   (%4.2f %% deleted)\n", solver.tot_literals, (solver.max_literals - solver.tot_literals)*100 / (double)solver.max_literals);
    printf("c nb reduced Clauses    : %lld\n",solver.nbReducedClauses);
    
    if (mem_used != 0) printf("Memory used           : %.2f MB\n", mem_used);
    printf("c CPU time              : %g s\n", cpu_time);
}

// Standard main for glucose is #if'ed out, this version is specialized for crosswords
#if 0

static Solver* solver;
// Terminate by notifying the solver and back out gracefully. This is mainly to have a test-case
// for this feature of the Solver as it may take longer than an immediate call to '_exit()'.
static void SIGINT_interrupt(int signum) { solver->interrupt(); }

// Note that '_exit()' rather than 'exit()' has to be used. The reason is that 'exit()' calls
// destructors and may cause deadlocks if a malloc/free function happens to be running (these
// functions are guarded by locks for multithreaded use).
static void SIGINT_exit(int signum) {
    printf("\n"); printf("*** INTERRUPTED ***\n");
    if (solver->verbosity > 0){
        printStats(*solver);
        printf("\n"); printf("*** INTERRUPTED ***\n"); }
    _exit(1); }


//=================================================================================================
// Main:

int main(int argc, char** argv)
{
    try {
      printf("c\nc This is glucose 3.0 --  based on MiniSAT (Many thanks to MiniSAT team)\nc Simplification mode is turned on\nc\n");
      
      setUsageHelp("c USAGE: %s [options] <input-file> <result-output-file>\n\n  where input may be either in plain or gzipped DIMACS.\n");
        
        
#if defined(__linux__)
        fpu_control_t oldcw, newcw;
        _FPU_GETCW(oldcw); newcw = (oldcw & ~_FPU_EXTENDED) | _FPU_DOUBLE; _FPU_SETCW(newcw);
        printf("WARNING: for repeatability, setting FPU to use double precision\n");
#endif
        // Extra options:
        //
        IntOption    verb   ("MAIN", "verb",   "Verbosity level (0=silent, 1=some, 2=more).", 1, IntRange(0, 2));
        BoolOption   mod   ("MAIN", "model",   "show model.", false);
        IntOption    vv  ("MAIN", "vv",   "Verbosity every vv conflicts", 10000, IntRange(1,INT32_MAX));
        BoolOption   pre    ("MAIN", "pre",    "Completely turn on/off any preprocessing.", true);
        StringOption dimacs ("MAIN", "dimacs", "If given, stop after preprocessing and write the result to this file.");
        IntOption    cpu_lim("MAIN", "cpu-lim","Limit on CPU time allowed in seconds.\n", INT32_MAX, IntRange(0, INT32_MAX));
        IntOption    mem_lim("MAIN", "mem-lim","Limit on memory usage in megabytes.\n", INT32_MAX, IntRange(0, INT32_MAX));

        parseOptions(argc, argv, true);
        
        SimpSolver  S;
        double      initial_time = cpuTime();

        S.parsing = 1;
        if (!pre) S.eliminate(true);

        S.verbosity = verb;
        S.verbEveryConflicts = vv;
	S.showModel = mod;
        solver = &S;
        // Use signal handlers that forcibly quit until the solver will be able to respond to
        // interrupts:
        signal(SIGINT, SIGINT_exit);
        signal(SIGXCPU,SIGINT_exit);

        // Set limit on CPU-time:
        if (cpu_lim != INT32_MAX){
            rlimit rl;
            getrlimit(RLIMIT_CPU, &rl);
            if (rl.rlim_max == RLIM_INFINITY || (rlim_t)cpu_lim < rl.rlim_max){
                rl.rlim_cur = cpu_lim;
                if (setrlimit(RLIMIT_CPU, &rl) == -1)
                    printf("WARNING! Could not set resource limit: CPU-time.\n");
            } }

        // Set limit on virtual memory:
        if (mem_lim != INT32_MAX){
            rlim_t new_mem_lim = (rlim_t)mem_lim * 1024*1024;
            rlimit rl;
            getrlimit(RLIMIT_AS, &rl);
            if (rl.rlim_max == RLIM_INFINITY || new_mem_lim < rl.rlim_max){
                rl.rlim_cur = new_mem_lim;
                if (setrlimit(RLIMIT_AS, &rl) == -1)
                    printf("WARNING! Could not set resource limit: Virtual memory.\n");
            } }
        
        if (argc == 1)
            printf("Reading from standard input... Use '--help' for help.\n");

        gzFile in = (argc == 1) ? gzdopen(0, "rb") : gzopen(argv[1], "rb");
        if (in == NULL)
            printf("ERROR! Could not open file: %s\n", argc == 1 ? "<stdin>" : argv[1]), exit(1);
        
      if (S.verbosity > 0){
            printf("c ========================================[ Problem Statistics ]===========================================\n");
            printf("c |                                                                                                       |\n"); }
        
        FILE* res = (argc >= 3) ? fopen(argv[argc-1], "wb") : NULL;
        parse_DIMACS(in, S);
        gzclose(in);

       if (S.verbosity > 0){
            printf("c |  Number of variables:  %12d                                                                   |\n", S.nVars());
            printf("c |  Number of clauses:    %12d                                                                   |\n", S.nClauses()); }
        
        double parsed_time = cpuTime();
        if (S.verbosity > 0){
            printf("c |  Parse time:           %12.2f s                                                                 |\n", parsed_time - initial_time);
            printf("c |                                                                                                       |\n"); }

        // Change to signal-handlers that will only notify the solver and allow it to terminate
        // voluntarily:
        signal(SIGINT, SIGINT_interrupt);
        signal(SIGXCPU,SIGINT_interrupt);

        S.parsing = 0;
        S.eliminate(true);
        double simplified_time = cpuTime();
        if (S.verbosity > 0){
            printf("c |  Simplification time:  %12.2f s                                                                 |\n", simplified_time - parsed_time);
            printf("c |                                                                                                       |\n"); }

        if (!S.okay()){
            if (S.certifiedUNSAT) fprintf(S.certifiedOutput, "0\n"), fclose(S.certifiedOutput);
            if (res != NULL) fprintf(res, "UNSAT\n"), fclose(res);
            if (S.verbosity > 0){
 	        printf("c =========================================================================================================\n");
               printf("Solved by simplification\n");
                printStats(S);
                printf("\n"); }
            printf("s UNSATISFIABLE\n");
            exit(20);
        }

        if (dimacs){
            if (S.verbosity > 0)
                printf("c =======================================[ Writing DIMACS ]===============================================\n");
            S.toDimacs((const char*)dimacs);
            if (S.verbosity > 0)
                printStats(S);
            exit(0);
        }

        vec<Lit> dummy;
        lbool ret = S.solveLimited(dummy);
        
        if (S.verbosity > 0){
            printStats(S);
            printf("\n"); }
        printf(ret == l_True ? "s SATISFIABLE\n" : ret == l_False ? "s UNSATISFIABLE\n" : "s INDETERMINATE\n");

        if (res != NULL){
            if (ret == l_True){
                printf("SAT\n");
                for (int i = 0; i < S.nVars(); i++)
                    if (S.model[i] != l_Undef)
                        fprintf(res, "%s%s%d", (i==0)?"":" ", (S.model[i]==l_True)?"":"-", i+1);
                fprintf(res, " 0\n");
            } else {
	      if (ret == l_False){
		fprintf(res, "UNSAT\n"), fclose(res);
	      }
	    }
            fclose(res);
        } else {
	  if(S.showModel && ret==l_True) {
	    printf("v ");
	    for (int i = 0; i < S.nVars(); i++)
	      if (S.model[i] != l_Undef)
		printf("%s%s%d", (i==0)?"":" ", (S.model[i]==l_True)?"":"-", i+1);
	    printf(" 0\n");
	  }

	}

#ifdef NDEBUG
        exit(ret == l_True ? 10 : ret == l_False ? 20 : 0);     // (faster than "return", which will invoke the destructor for 'Solver')
#else
        return (ret == l_True ? 10 : ret == l_False ? 20 : 0);
#endif
    } catch (OutOfMemoryException&){
	        printf("c =========================================================================================================\n");
        printf("INDETERMINATE\n");
        exit(0);
    }
}

#endif
