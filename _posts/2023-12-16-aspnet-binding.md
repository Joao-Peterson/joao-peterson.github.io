---
layout: post
title:  "Model binding no Aspnet core e binding de strings para Enums"
author: [peterson]
date:   2023-12-16 16:00:00 -0300
description: "Model binding no Aspnet core e binding de strings para Enums"
categories: [linux, c_sharp, web]
keywords: [linux, c#, aspnet, dotnet, dotnet core, core, aspnet core, model binding, mvc]
published: true
katex: true
---

# Sumário
- [Sumário](#sumário)
- [Introdução](#introdução)
- [Premissa](#premissa)
- [CustomModelBinding](#custommodelbinding)
  - [Observações](#observações)
  - [Implementação](#implementação)
- [JsonConverter](#jsonconverter)
  - [Observações](#observações-1)
  - [Implementação](#implementação-1)
- [TypeConverter](#typeconverter)
  - [Observações](#observações-2)
  - [Implementação](#implementação-2)
- [Melhor solução na minha opinião](#melhor-solução-na-minha-opinião)
- [Pensamentos finais](#pensamentos-finais)
- [Referências](#referências)

# Introdução

Quando fazemos aplicações em aspnet core, geralmente temos um controlador que recebe diretamente o modelo desserializado do corpo da requisição em nossa `IActionResult` de POST e etc, algo do tipo:

```c#
namespace Projeto.Controllers;

[ApiController]
[Route("/")]
public class ProjectController : ControllerBase{
    [HttpPost("/endpoint")]
    [Consumes("application/json")]
    public IActionResult PostPlain(MyModel data){
        return Ok(data.ToString());
    }
}
```

Onde `MyModel` é:

```c#
namespace Projeto.Models;

public class MyModel{
    public int Field1 { get; set; }
    public required string Field2 { get; set; }
}
```

Então, quando mandamos a requisição a seguir para esta rota, `POST server/endpoint`, vamos obter o corpo já desserializado e transformado em nosso modelo, caso o corpo não seja válido para com o modelo, o próprio aspnet retornará um erro de validação.

```json
{
    "field1": 42,
    "field2": "Ullamco eiusmod officia voluptate est ex veniam nostrud enim veniam ullamco anim.",
}
```

Um processo relativamente simples, feito para ser usado dessa forma, você pode inclusive anotar os valores dos modelos para aceitar ranges específicos, strings com formate de e-mail e etc, podendo também validar não só o corpo mas a querystring e cabeçalhos de requisições. Porém, quando precisamos alterar a forma como esse sistema funciona, as coisas complicam.

Quando precisamos não só validar se uma string é não vazia, não só aplicar um regex nela, mas precisamos também converte-la para um Enum no modelo, ou ainda, quando uma lista no json precisa ser convertida em um `Dictionary`, precisamos recorrer as formas corretas para alterar a forma de funcionamento.

Existem basicamente três formas de alterar o processo de desserialização, conversão e validação, uma é alterando a forma como valores são colocados, o binding, que ocorre após as conversão, usando um `CustomModelBinding`. No momento da desserialização, com um `JsonConverter`. Ou ainda usando um `TypeConverter`, que afeta a forma como o acesso ao tipo e o converte diretamente.

# Premissa

Queremos poder transformar nossos modelo para que cheguem prontos as actions dos endpoints, usando para isso [CustomModelBinding](#custommodelbinding) ou [JsonConverter](#jsonconverter). Em especial eu quero que, dado um modelo que possua uma propriedade de tipo Enum definido, que esta seja capaz de receber o valor do corpo de uma requisição, onde sua contrapartida é uma string, binding de string para Enum dentro de um modelo, para este vamos usar um [JsonConverter](#jsonconverter).

Também iremos explorar o simples `TypeConverter`, para casos mais simples também.

# CustomModelBinding

O custom model binding basicamente é o processo de:

* Declarar uma classe que implementa `IModelBinder` 
* Declarar uma classe que implementa `IModelBinderProvider`, que irá prover a classe anterior 
* Registrar o provider com `WebApplication.builder.Services.AddControllers` 

Onde o `IModelBinder` possuí a lógica de te fornecer um contexto com o tipo e nome da variável a ser 'bindada', que você pode usar para ler o valor após a desserialização e converter para o que for antes da validação.

## Observações
* Esse método só funciona para modelos de alto nível, ou seja, classes e tipos declarados pelo programador, tipos primitivos como, int, string e Enum, utilizam um binder padrão (*esse pode ser sobrescrito para alterar o funcionamento, eu tentei testar essa solução mas desisti por que no aspnet core não há forma fácil de fazer isso, somente no aspnet mvc*).
* Esse método só funciona para parâmetros de forma direta, por exemplo, se em uma rota recebemos um `public IActionResult Post(MyModel data)`, o `CustomBinder` irá ser feito sobre este, mas se dentro de `MyModel` tivermos um campo/propriedade que também necessite de custom binding, este não o será feito pelo aspnet. **Não há custom binding a nível de campo/propriedade**.
* Podemos atrelar um `CustomModelBinder` para um tipo específico com a anotação: `[ModelBinder(BinderType = typeof(MyModelBinder))]`, porém ela não se aplica a Propriedades/Campos, assim a observação anterior continua valendo.

## Implementação

Para fazer é bem simples, primeiros vamos implementar o CustomBinder para um typo `MyModel`, onde o corpo que recebemos na requisição é apenas um numero inteiro, mas em nosso modelo temos uma string que deve ser bindada, pois é required. Esse tipo de situação pode acontecer quando `CustomDataString` pode vir de uma database com base em uma chave como `data`, podemos assim realizar requisições externas dentro do binder, antes mesmo de chegar a função a rota. Ou ainda quando desejamos transformar os dados, como quando necessitamos de formatação diferente na string.

No caso a seguir queremos transformar a string, concatenando o valor a ela, apenas para ilustração.

Modelo:

```c#
namespace Projeto.Models;

public class MyModel{
    public int data { get; set; }
    public required string customDataString { get; set; }
}
```

Json desejado:
```json
{
    "data": 42,
    "customDataString": "a value goes right after here -> "
}
```

CustomBinder:

```c#
namespace Projeto.CustomModelBinders;

public class MyModelBinder : IModelBinder{
    // pro tip! you can fetch data inside this async function by providing a constructor that receives
    // a database context by dependency injection. See: https://learn.microsoft.com/en-us/aspnet/core/mvc/advanced/custom-model-binding?view=aspnetcore-8.0#custom-model-binder-sample
    public Task BindModelAsync(ModelBindingContext ctx){
        if(ctx == null) throw new ArgumentNullException(nameof(ctx));

        // try to fetch the value the 'MessageType parameter' by it's name 
        var modelName = ctx.ModelName;
        var valueProviderResult = ctx.ValueProvider.GetValue(modelName);

        if(valueProviderResult == ValueProviderResult.None)
            return Task.CompletedTask;

        // set model state
        ctx.ModelState.SetModelValue(modelName, valueProviderResult);

        // check 'data' value (string)
        var dataValue = valueProviderResult.Values.ElementAt(0);
        if(string.IsNullOrEmpty(value))
            return Task.CompletedTask;

        // parsing 'data' here, return if error
        if(!int.TryParse(dataValue, out var data)){
            bindingContext.ModelState.TryAddModelError(modelName, "data field passed was not an integer.");
            return Task.CompletedTask;
        }

        // check 'customDataString' value (string)
        var customDataStringValue = valueProviderResult.Values.ElementAt(1);
        if(string.IsNullOrEmpty(value))
            return Task.CompletedTask;

		var model = new MyModel(){
            data = data
            customDataString = customDataStringValue + data.ToString();, 
        };

        // return model
        ctx.Result = ModelBindingResult.Success(model);
        return Task.CompletedTask;
    }
}
```

E depois um provider, cuja função será definir qual tipo o binder agirá sobre, ou seja, por favor aspnet, use este binder para este tipo. 

```c#
namespace Projeto.CustomModelBinders;

public class MyModelBinderProvider : IModelBinderProvider{

    public IModelBinder? GetBinder(ModelBinderProviderContext context){
        if (context == null)
            throw new ArgumentNullException(nameof(context));

        if (context.Metadata.ModelType == typeof(MessageType))
            return new BinderTypeModelBinder(typeof(MyModelBinder));

        return null;
    }
}
```

Para que o aspnet tenha conhecimento do provider, vamos cadastra-lo em nossa aplicação, em `Program.cs`, na função lambda/arrow/anônima de `options` do `builder.Services`.

```c#
using Projeto.CustomModelBinders;

var config = new ConfigurationBuilder().AddEnvironmentVariables().Build();

// app
var builder = WebApplication.CreateBuilder(args);

// DI
builder.Services.AddControllers(options => {
    options.ModelBinderProviders.Insert(0, new MessageTypeBinderProvider());
});
builder.Services.AddSingleton<IConfiguration>((sp) => config);

// app config
var app = builder.Build();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

**Caso não deseje utilizar o `Provider`**, você pode sempre anotar seu modelo da seguinte forma:

```c#
namespace Projeto.Models;

[ModelBinder(BinderType = typeof(MyModelBinder))]
public class MyModel{
    public int data { get; set; }
    public required string customDataString { get; set; }
}
```

Vai dar na mesma.

E pronto, agora quando você criar seu endpoint, receberá os dados conforme esperado:

```c#
namespace Projeto.Controllers;

[ApiController]
[Route("/")]
public class MyProjectController : ControllerBase{
    [HttpPost("/model")]
    [Consumes("application/json")]
    public IActionResult PostModel(MyModel model){
        Console.WriteLine(model.data);  // 42
        Console.WriteLine(model.customDataString); // 'a value goes right after here -> 42'
        return Ok(data.ToString());
    }
}
```

# JsonConverter

Como falado na sessão de [premissas](#premissa) e observado na sessão do [customModelBinding](#custommodelbinding), para propriedades dentro do modelo, não conseguimos fazer um custom binding, porém, com o Json Converter conseguimos especificar o parsing da string a nível de propriedade dentro do modelo, dando a liberdade que desejamos para a transformação.

## Observações
* Quando utilizamos um JsonConverter em um Tipo ou Propriedade, não afetamos o binding do modelo que o corporta em si, portanto **não é necessário** criar bindings customs para seu modelo, só o do json converter para a propriedade/campo/tipo.

## Implementação

Para transformar string para Enum vamos primeiro criar um json converter e depois atrelá-lo a propriedade do modelo. Quero também que seja possível utilizar números e strings para conversão, mas veremos a frente.

Dado o json:

```json
{
    "value1": 1,
    "value2": "status2",
}
```

E Modelo:

```c#
namespace Projeto.Models;

public enum MyEnum{
    Unknown = -1,
    Status0 = 0,
    Status1,
    Status2
}

public class MyModel{
    public required MyEnum value1;
    public required MyEnum value2;
}
```

Para uma action:

```c#
namespace Projeto.Controllers;

[ApiController]
[Route("/")]
public class MyProjectController : ControllerBase{
    [HttpPost("/model")]
    [Consumes("application/json")]
    public IActionResult PostModel(MyModel model){
        return Ok(data.ToString());
    }
}
```

Vamos fazer o seguinte JsonConverter, onde temos herdamos de `JsonConverter<MyEnum>`, indicando o tipo de conversão, e implementamos `Read` e `Write`.

```c#
public class MyEnumConverter : JsonConverter<MyEnum>{

    public override MyEnum Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options){
        
        // get string
        if(reader.GetString() is string valueString){
            // parse as int
            if(int.TryParse(valueString, out var valueInt)){								// integer
                // if is enum value
                if(Enum.IsDefined(typeof(MyEnum), valueInt)){
                    return (MyEnum)valueInt;
                }
            }
            // if not int, then string
            else if(Enum.TryParse(typeof(MyEnum), valueString, true, out var parsed))	    // string
                return (MyEnum)parsed;
        }

        // default
        return MyEnum.Unknown;
    }

    public override void Write(Utf8JsonWriter writer, MyEnum value, JsonSerializerOptions options){
        writer.WriteStringValue(value.ToString().ToLower());
    }
}
```

Vemos que em `Read`, responsável pela desserialização, verificamos se a string recebida no json é um número, se sim, apenas fazemos cast para o Enum, senão, tentamos fazer parse da string para enum, e se for, retornamos o cast, caso não tenhamos nada, retornar o valor default `Unknown`.

Para `Write` fazemos apenas `ToString()` em lowercase.

Como dito na documentação, para `JsonConverters` de tipos genéricos e de Enums, que é como se fosse um genérico pois enum é um tipo base mas cada enum definido é diferente, precisamos implementar um `JsonConverterFactory`, para que o desserializador de json possa usar um conversor certo para cada caso de tipo genérico. **Tipos simples não precisam de tal Factory, apenas o Converter**.

Para a factory, basta herdar `JsonConverterFactory`, e implementar `CanConvert` e `CreateConverter`. 

```c#
public class MyEnumConverterFactory : JsonConverterFactory{

    public override bool CanConvert(Type typeToConvert){
        return typeToConvert == typeof(MyEnum);
    }

    public override JsonConverter CreateConverter(Type type, JsonSerializerOptions options){
        return new MyEnumConverter();
    }
}
```

Em `CanConvert`, definimos qual tipos genéricos de entrada podem ser serializados, neste caso será a comparação para com apenas o tipo do enumerador `MyEnum`.

Em `CreateConverter`, retornamos a instância do `MyEnumConverter`, pois sempre esperaremos o tipo `MyEnum`, caso houvesse tipos genéricos, como outros enums ou genérico `T` por exemplo, faríamos verificação para com `Type type` e faríamos um caso para cada tipo.

Agora basta anotar nossas propriedades:

```c#
namespace Projeto.Models;

public class MyModel{
    [JsonConverter(typeof(MyEnumConverterFactory))]
    public required MyEnum value1;
    [JsonConverter(typeof(MyEnumConverterFactory))]
    public required MyEnum value2;
}
```

Ou apenas o tipo em si, (mais prático!):

```c#
namespace Projeto.Models;

[JsonConverter(typeof(MyEnumConverterFactory))]
public enum MyEnum{
    Unknown = -1,
    Status0 = 0,
    Status1,
    Status2
}
```

E funcionará magicamente:

```json
{
    "value1": 1,
    "value2": "status2",
}
```

```c#
namespace Projeto.Controllers;

[ApiController]
[Route("/")]
public class MyProjectController : ControllerBase{
    [HttpPost("/model")]
    [Consumes("application/json")]
    public IActionResult PostModel(MyModel model){
        Console.WriteLine(model.value1.ToString()); // MyEnum.Status1
        Console.WriteLine(model.value2.ToString()); // MyEnum.Status2
        return Ok(data.ToString());
    }
}
```

# TypeConverter

De forma mais simples, podemos utilizar ainda um `TypeConverter`.

## Observações
* Assim como [CustomModelBinding](#custommodelbinding), esse tipo de conversão não funciona em propriedades de modelos, apenas no modelo diretamente, seja `[FromBody]`, `[FromQuery]` e etc. Porém, se essa for sua aplicação, converter uma string para enum, que vem na forma de querystring, `/endpoint?value1=enumvalue`, ou até mesmo Headers, então o type converter será mais simples. 

## Implementação

Para uma action do tipo:

```c#
namespace Projeto.Controllers;

[ApiController]
[Route("/")]
public class MyProjectController : ControllerBase{
    [HttpGet("/model")]
    public IActionResult GetDataFromStatus([FromQuery] StatusEnum status){
        return Ok(data.ToString());
    }
}
```

E enum:

```c#
namespace MyProject.Models;

public enum StatusEnum{
    Invalid = -1,
    Idle = 0,
    Started,
    Working,
    Waiting
    Ended
}
```

Vamos criar o `TypeConverter` herdando de `EnumConverter`:

```c#
public class StatusEnumConverter : EnumConverter{
    public StatusEnumConverter(
        [DynamicallyAccessedMembers(
            DynamicallyAccessedMemberTypes.PublicParameterlessConstructor | 
            DynamicallyAccessedMemberTypes.PublicFields
        )] Type type
    ) : base(type)
    {

    }

    public override object? ConvertFrom(ITypeDescriptorContext? context, CultureInfo? culture, object value){

        if(value is string valueString){
            if(int.TryParse(valueString, out var valueInt)){							    // integer
                if(Enum.IsDefined(typeof(StatusEnum), valueInt)){
                    return (StatusEnum)valueInt;
                }
            }
            else if(Enum.TryParse(typeof(StatusEnum), valueString, true, out var parsed))	// string
                return parsed;
        }

        return StatusEnum.Invalid;
        // return base.ConvertFrom(context, culture, value);
    }
}
```

Obrigatoriamente implementamos o construtor e `ConvertFrom`, cuja implementação é bastante parecida com o método de [Jsonconverter](#implementac3a7c3a3o-1), onde temos teste para `int` e `string`, e um valor padrão, aqui `invalid`. Note que se fosse desejado, poderíamos ao final repassar o retorno para `base.convertFrom`, usando o conversor padrão caso fosse desejado.

Agora basta anotar o tipo:

```c#
namespace MyProject.Models;

[TypeConverter(typeof(StatusEnumConverter))]
public enum StatusEnum{
    Invalid = -1,
    Idle = 0,
    Started,
    Working,
    Waiting
    Ended
}
```

**Ou** diretamente no parâmetro, para obter:

```c#
namespace Projeto.Controllers;

[ApiController]
[Route("/")]
public class MyProjectController : ControllerBase{
    [HttpGet("/model")]
    public IActionResult GetDataFromStatus([FromQuery, TypeConverter(typeof(StatusEnumConverter))] StatusEnum status){
        Console.WriteLine(status.ToString()); // StatusEnum.Invalid
        return Ok(data.ToString());
    }
}
```

Caso tenha sido feita a seguinte requisição:

```
GET http://server/model?status=lmao
```

# Melhor solução na minha opinião

De todos os tipos, o mais fácil seria não fazer nada a respeito e simplesmente deixar que o model binding faça o binding para número inteiro, e que em caso de string, que deixássemos como string e depois convertêssemos para o tipo enum desejado quando necessário, mas entre nós, eu gosto de inventar moda!

Assim, deixo aqui minha solução usando JsonConverter + Classe auxiliar. 

Para o json:

```json
{
    "value1": 1,
    "value2": "status2",
}
```

E Modelo:

```c#
namespace Projeto.Models;

public enum MyEnum{
    Unknown = -1,
    Status0 = 0,
    Status1,
    Status2
}

public class MyModel{
    public required MyEnum value1;
    public required MyEnum value2;
}
```

Vamos anotar o enumerador com o seguinte JsonConverter:

```c#
[JsonConverter(typeof(MyEnumTypeConverter))]
public enum MyEnum{
    Unknown = -1,
    Status0 = 0,
    Status1,
    Status2
}
```

Que é dado como:

```c#
public class MyEnumTypeConverter : JsonConverter<MyEnumType>{
    public override MyEnumType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
		=> EnumFromStrIntConverter<MyEnumType>.Parse(reader.GetString(), MyEnumType.Unknown);

    public override void Write(Utf8JsonWriter writer, MyEnumType value, JsonSerializerOptions options)
		=> EnumFromStrIntConverter<OriginModelType>.ToString(value);
}
```

Note como diferente do [JsonConverter](#jsonconverter) normal, não utilizamos uma Factory, isso por que mesmo a documentação falando que precisa, eu descobri que funciona sem!

Também note que os métodos de `Read` e `Write` usam métodos de uma classe auxiliar, esta sendo:

`EnumFromStrInt.cs`:
```c#
using System.Text.RegularExpressions;

public static class EnumFromStrIntConverter<T> where T : struct, Enum{
	static public T Parse(string? value, T defaultValue){

		if(value != null){
			var a = PascalCase(value);
			if(Enum.TryParse(typeof(T), value, true, out var parsed)){
				return (T)parsed;
			}
			else if(Enum.TryParse(typeof(T), a, true, out var parsedCamel)){
				return (T)parsedCamel;
			}
		}

		return defaultValue;
	} 

	static public string ToString(T value){
		return value.ToString();
	}

	static private string CamelCase(string str){
		return Regex.Replace(str, "[ _-]([A-Za-z])", m => m.Groups[1].Value.ToUpper());
	}

	static private string PascalCase(string str){
		return char.ToUpper(str[0]) + CamelCase(str.Substring(1));
	}
} 
```

Classe auxiliar que provém dois métodos para conversão 'de/para' o enumerador, sendo que para o parsing tenta-se fazer o parsing normal, string e string de número para enum, e o parsing caso o enum tenha valores em PascalCase mas a string de entrada não for. 

# Pensamentos finais

É ainda interessante verificar que para todos os tipos de conversão, exceto o meu [método próprio](#melhor-solução-na-minha-opinião), podemos anotar um enumerador com nomes exatos para serialização e desserialização, mesmo que tenhamos usado a seguinte conversão de string para enum:

```c#
Enum.TryParse(typeof(StatusEnum), valueString, true, out var parsed)
```

Onde `true` indica que a capitalização é ignorada (case insensitive).

Exemplo:

```c#
public enum StatusEnum{
    [EnumMember(Value = "invalid-status")]
    Invalid = -1,
    [EnumMember(Value = "idle-status")]
    Idle = 0,
    [EnumMember(Value = "started-status")]
    Started,
    [EnumMember(Value = "working-status")]
    Working,
    [EnumMember(Value = "waiting-status")]
    Waiting,
    [EnumMember(Value = "ended-status")]
    Ended
}
```

Então poderíamos usar os `Values`'s em nosso json ou query para realizar a conversão correta para o Enum.

E é isso, referências abaixo, para sugestões e conversação, mu e-mail encontra-se na página inicial do blog, até mais. 

# Referências

* [Aspnet core - Model validation](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation?view=aspnetcore-7.0)
* [Aspnet core - Model binding](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/model-binding?view=aspnetcore-7.0)
* [Aspnet core - Custom Model binding](https://learn.microsoft.com/en-us/aspnet/core/mvc/advanced/custom-model-binding?view=aspnetcore-8.0)
* [Aspnet core - Json Converter](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/converters-how-to?pivots=dotnet-8-0)
* [NewtonSoft JSON](https://github.com/TelegramBots/Telegram.Bot/issues/865#issuecomment-580421889)