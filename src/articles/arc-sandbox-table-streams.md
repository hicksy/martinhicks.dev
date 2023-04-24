---
title: "DynamoDB Streams locally with arc.codes & Enhance"
description: "Introducing a new plugin for working with DynamoDB streams locally within arc.codes and enhance projects"
date: 2023-04-24
image: 
  path: /images/articles/862af880b5220e15.jpeg
  webp: /images/articles/862af880b5220e15.webp
  alt: Architect banner image

---

### Introduction

When working on a recent web app project using [Enhance](https://enhance.dev), I encountered a requirement for using both transactions and DynamoDB streams, two DynamoDB features that aren't supported by Dynalite - the fast in-memory DynamoDB engine that [Architect](https://arc.codes) uses to support local development. 

In this article, I'll introduce my new plugin ([arc-plugin-sandbox-stream](https://www.npmjs.com/package/@hicksy/arc-plugin-sandbox-stream)) for working with DynamoDB streams locally within Arc and Enhance projects. This plugin enables developers to use DynamoDB streams locally in their arc or enhance sandbox environment.  

### Background

Architect got me hooked back in 2018 with its amazing local developer experience, it's a huge DX boon to be able to try ideas out on your own machine without being concerned about provisioning real infrastructure, or being tied to a location where network connectivity is guaranteed. 

One of the services Architect spins up locally is [Dynalite](https://github.com/mhart/dynalite). It provides a fast in-memory DynamoDB engine. For lots of projects this engine is absolutely ideal, fast to launch, lightweight and not a process hog. But for this particular project I really needed streams and I wasn't prepared to sacrifice the local developer experience. So I set about researching how this could be achieved, if at all. Helpfully it's a question that has cropped up on [Arc's discord](https://discord.com/channels/880272256100601927/1078256032087805972/1079142054279524552) and the thread of replies helped point me in the right direction. 

I'd need to do a few things:
 
1) Switch to using DynamoDB Local 
2) Create a middleware to poll the stream for new data
3) Invoke the corresponding function handler when new data is returned from the stream. 



## Using the plugin

The plugin kicks in when a `@tables-streams` pragma is discovered within your arc config, and queries the table meta data / stream meta data to retrieve iterators for each shard of the table's stream. 

If data is found the plugin invokes the corresponding lambda function using arc's inbuilt invoke function. 

Your function code will receive one or more results off the stream like so (as you'd expect if you've used streams on AWS):

```
[
  {
    "eventID": "7c1ac231-2c9d-4ba0-b3a2-1de2eb6602c0",
    "eventName": "MODIFY",
    "eventVersion": "1.1",
    "eventSource": "aws:dynamodb",
    "awsRegion": "ddblocal",
    "dynamodb": {
      "ApproximateCreationDateTime": "2023-04-24T12:19:00.000Z",
      "Keys": {
        "sk": {
          "S": "account:si-novi"
        },
        "pk": {
          "S": "account:si-novi"
        }
      },
      "NewImage": {
        "_type": {
          "S": "Organisation"
        },
        "name": {
          "S": "Si Novi"
        },
        "sk": {
          "S": "account:si-novi"
        },
        "created_at": {
          "S": "2023-04-24T12:19:07.409Z"
        },
        "id": {
          "S": "01GYSK850HWHGE36A2VTDG1CPK"
        },
        "pk": {
          "S": "account:si-novi"
        },
        "modified_at": {
          "S": "2023-04-24T12:19:07.409Z"
        },
        "slug": {
          "S": "si-novi"
        }
      },
      "SequenceNumber": "000000000000000000935",
      "SizeBytes": 310,
      "StreamViewType": "NEW_IMAGE"
    }
  }
]
```


### Setup

__1. Add the dependency to your project__

`npm install @hicksy/arc-plugin-sandbox-stream`

__2. Configure your project to use @tables-streams in `.arc` file__

```
@tables
example
  pk *String
  sk **String

@tables-streams
example
```
__3. Add the plugin to arc config__


```
@plugins
hicksy/arc-plugin-sandbox-stream
```

__4. Setup DynamoDB Local__


There are various ways to use DyanmoDB Local. I opted for the bundled version that comes with [AWS's NoSQL Workbench tool](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html). But you can use which ever version you're comfortable with. 

Just note that if you use the NoSQL Workbench version there's the following caveats I came accross:

- Data storage is persistent in the NoSQL Workbench version - I can't find a way to set the `inMemory` flag available to the standalone / docker version (you'll need to modify any seed scripts to conditionally insert or drop and re-create the table)
- You need to be running NoSQL Workbench while you develop and remember to toggle on DynamoDB Local each time (not a biggie really, but it'd be great to have the means to set it to autostart or run as a start-up background task)
- The NoSQL Workbench version runs on port 5500, I can't see a way to change this, but it's not a problem for me. 



__5. Configure Arc to use DynamoDB Local__

#### Arc environment params
Arc makes it really easy to switch out Dynalite for DynamoDB Local. 

There's a couple of env vars you need to set to get your going. 

1. Tell arc that you're using an external db
2. Change the port used for tables within arc
3. Set your region to `ddblocal`

You can do this one of several ways. 

Either setting an environment variable ARC_DB_EXTERNAL=true / ARC_TABLES_PORT=5500 in an `.env` file, or using the `prefs.arc` file and setting the properties within the @sandbox section [see arc's docs for more info](https://arc.codes/docs/en/reference/configuration/local-preferences#local-preferences)

e.g. 

.env file
```
APP_URL=http://localhost:3333
ARC_TABLES_PORT=5500
```

prefs.arc file
```
@sandbox
external-db true
```

#### Arc data seeds
As DynamoDB Local data is persistent when using the bundled NoSQL Workbench version, you'll need to modify any startup data seeds you have and update them to either conditionally insert data, or what I prefer, to delete the table and re-create it each time - this makes it more in keeping with all my other arc projects. 

#### Arc table create or update
Sadly, as Dynalite doesn't support streams, arc's sandbox doesn't create the table with the required `StreamSpecification` param, so you'll need to supply that either when re-creating the table using `createTable` or supplying it via an `updateTable` call. 

An example `StreamSpecifcation` looks like:

```
StreamSpecification: {
	StreamEnabled: true,
	StreamViewType: 'NEW_IMAGE' 
},
```

The project I'm working on currently uses Sensedeep's [OneTable](https://github.com/sensedeep/dynamodb-onetable). So I can achieve the above like:

```
const client = new Dynamo({client: new DynamoDBClient(params)})
const table = new Table({
    name: DDB_NAME,
    client: client,
    logger: true,
    schema: AppSchema,
    partial: false
})

if(await table.exists()) {
	await table.deleteTable('DeleteTableForever');
}

await table.createTable({
    StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_IMAGE' 
    },
});
```

You can also do this using the standard JS dynamodb client for any projects that aren't using an additional toll like onetable. 

_tip: use architect-functions to infer the full name for your DynamoDB table's, which will be a combination of the name you've given and it's deployement envuronemnt etc_


__6. Modify the polling interval [optional]__


By default the plugin will poll for new stream data every 10 seconds. You can override this by providing an alternate millisecond interval by updating your `.arc` file

```
@sandbox-table-streams
polling_interval 1000
```
 

### Get in touch 

Any feedback on your usage of this plugin, bugs, or suggestions for improvements please get in touch on [GitHub](https://github.com/hicksy/arc-plugin-sandbox-stream). I'd love to hear from you. 

* GitHub: [https://github.com/hicksy/arc-plugin-sandbox-stream](https://github.com/hicksy/arc-plugin-sandbox-stream)
* NPM: [https://www.npmjs.com/package/@hicksy/arc-plugin-sandbox-stream](https://www.npmjs.com/package/@hicksy/arc-plugin-sandbox-stream)

___
