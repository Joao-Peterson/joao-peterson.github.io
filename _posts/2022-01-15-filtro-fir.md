---
layout: post
title:  "Filtro FIR Passa baixa - Exercício de Processamento Digital de Sinais"
author: [peterson]
date:   2022-01-15 09:30:00 -0300
description: "Filtro FIR Passa baixa - Exercício de Processamento Digital de Sinais"
categories: [dsp]
keywords: [octave, dsp, pds, processamento_digital_de_sinais, matlab, filtro, FIR, fir, linux]
published: true
katex: true
---

Olá leitores, neste vídeo eu mostro um pouco para vocês a resolução de um exercício da disciplina de Processamento Digital de Sinais onde pede se a implementação de um filtro FIR passa baixa para realizar a filtragem de um sinal de áudio dado.

<div style="margin: 40px">
    <lite-youtube videoid="NVCgto52RCs">
        <button type="button" class="lty-playbtn">
            <span class="lyt-visually-hidden">Filtro FIR Passa baixa - Exercício de Processamento Digital de Sinais</span>
        </button>
    </lite-youtube>
</div>

A avaliação propõe a implementação de um filtro passa baixas do tipo FIR, *finite impulse response*, para filtrar um sinal de áudio de voz com ruído de alta frequência, dado de forma a conseguir se um sinal de saída audível e também uma transcrição do conteúdo do áudio de voz.

O áudio dado possuí frequência de amostragem de $$24 KHz$$. O conteúdo de frequência da voz humana é de $$125Hz$$ a $$8KHz$$, portanto irá ser utilizado uma frequência de corte empírica de $$6KHz$$.

Um filtro FIR pode ser descrito pela equação diferença a seguir.

$$
    y(n) = \sum _{i=0}^{2M} h(n-M) \cdot x(n-i)
$$

Onde $$M$$ é relacionado ao tamanho da janela do filtro pela forma $$k=2M+1$$, $$h(n)$$ é a resposta ao impulso do filtro desejado, neste caso um passa baixa, e $$x(n)$$ a entrada a ser filtrada.

Para um filtro passa baixa, a resposta ao impulso pode ser dada pela equação a seguir.

$$
    h(n) =
    \begin{cases} 
        \frac{\Omega _c}{\pi} & n=0 \\
        \frac{sin(\Omega _c \cdot n)}{n\cdot \pi} & \text{for } n \ne 0 \text{, } -M\le n \le M
    \end{cases}
$$

Onde $$\Omega _c$$ é a frequência de corte normalizada dada pela equação a seguir, onde $$\omega _c$$ é a frequência de corte em $$rad/s$$ e $$\omega _s$$ a frequência de sampling. 

$$
    \Omega _c = \frac{\omega _c\cdot 2\pi}{\omega _s}
$$

Para implementação do filtro e filtragem, foi utilizado o *software* GNU Octave, compatível com Matlab.

Como visto na equação diferença acima, o filtro depende dos elementos de $$h(n)$$, que podem ser dados em uma lista de coeficientes calculados usando a equação de resposta ao impulso.   

`"fir_lowpass.m":`
```matlab
% compute the coefficients for a FIR lowpass filter
% wc: cutoff frequency given in rad/2
% len: the discrete length of the filter
% return: list of coefficients

function filt = fir_lowpass(wc, ws, len)
    
    if (mod(len,2) == 0)
        error("The FIR filter len should be a odd number. Number passed: \"%i\".", len);
    end

    % normalized cutoff frequency
    Wc = 2*pi/ws * wc;

    for n = 1:((len-1)/2)
        hp(n) = sin(Wc*n)/(n*pi);
        hn((len-1)/2 - (n-1)) = hp(n);
    end

    h0 = Wc/pi;

    filt = [hn h0 hp];
end
```

O código acima apresenta a implementação para o cálculo da resposta ao impulso para o filtro passa baixa, aceitando um tamanho $$k$$ ímpar, $$size$$, frequência de corte $$\omega _c$$ e frequência de amostragem $$\omega _s$$. 

Como o vetor de elementos é espelhado, calcula se os elementos positivos primeiro, os elementos negativos são calculados de forma espelhada, e ao final, linha 22, ambos são combinados com o valor de $$h(0)$$ em um único vetor.

Para aplicação do filtro, pode se aplicar dois laços de repetição, onde um calcula o elemento $$y(n)$$ e o outro laço aninhado calcula o somatório do produto entre $$h(n-M)$$ e $$x(n-i)$$.

Para o primeiro laço é necessário saber o tamanho da saída $$y$$ a priori, que pode ser dado como:

$$
    y_{len} = x_{len} + h_{len} - 1
$$

`"fir_applyfilter.m":`
```matlab
% compute the output of a FIR filter from a input and a filter
% filter: array of filter coefficients
% input: the input array
% return: list of coefficients

function out = fir_applyfilter(filt, in)

    h = filt;
    x = in;
    h_len = length(h);
    x_len = length(x);
    out_len = (h_len+x_len-1);

    progress_bar = waitbar(0);

    % loop through the output shifiting the input by 'n-1'. The output convolution is the sum of the inputs lengths plus 1
    for n = (1:out_len)

        acc = 0;
        
        % loop through the filter coefficients 
        for i = (1:(h_len))
            n_sample = i + (x_len-1) - (n-1);

            if (n_sample < x_len && n_sample >= 1)
                acc += h(i) * x(n_sample);
            end

        end

        waitbar(n/out_len, progress_bar);

        out(n) = acc;
    end

    % i dunno why but the algorithm gives the output reversed, so i jsut reversed it again 
    out = fliplr(out);

end
```

A listagem de código acima apresenta a implementação, sendo necessário receber o vetor de filtro e o vetor de entrada.

Para obter se a saída basta aplicar as funções mostradas em ordem, observa se que o tamanho do filtro FIR, dado como $$k=251$$ foi obtido de forma empírica por tentativa em erro, valores pequenos de $$k$$ implementam um filtro muito longe do filtro ideal projetado enquanto que valores maiores aproximam o filtro ideal com maior fidelidade, ao custo de tempo de processamento.

`"main.m":`
```matlab
% load audio
load dados_trabalho2_aluno.mat

% compute filter
filter = fir_lowpass(6000*2*pi, 24000*2*pi, 251);

% compute output, very slow!
out = fir_applyfilter(filter, sinal_trabalho_ruido);
save -mat audio.mat out;

% create playback
audio = audioplayer(out, 24000);
play(audio);
```


