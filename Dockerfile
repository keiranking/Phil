FROM emscripten/emsdk:3.1.42

COPY /src/third_party /usr/src/app/third_party

WORKDIR /usr/src/app/third_party/glucose-3.0/simp

RUN make xwsolve.js

COPY src /usr/src/app

WORKDIR /usr/src/app

RUN ln -s third_party/glucose-3.0/simp/xwsolve.* . 

CMD ["python3", "-m", "http.server", "8000"]