---
title: "DynamoDB Streams locally with arc.codes & Enhance"
description: "Introducing a new plugin for working with DynamoDB streams locally within arc.codes and enhance projects"
date: 2023-04-24
image: 
  path: /images/articles/862af880b5220e15.jpeg
  webp: /images/articles/862af880b5220e15.webp
  alt: Architect banner image

---

### Background

Recently I've been working on a web app project using [Enhance](http://enhance.dev) and had a requirement for using two features of DynamoDB that aren't supported by [Dynalite](https://github.com/mhart/dynalite) - the fast in-memory DynamoDB engine that arc uses to support local development. 

I considered switching to use a real remote DynamoDB table, which I think would've been fine for simply supporting transactions, but for DynamoDB streams I wanted to hit my locally developed function code so I could easily test and iterate without trawling through cloud formation logs. 

It's the local development experience that really got me hooked into using Architect back in 2018 - I don't need to consider where I am when I'm working, how reliable my connection is (if I have one at all), or have any concerns over usage limits / costs - so I decided to read up on how support for table streams within arc's local environment could be achieved. 

Unsurprisingly it's a question that has cropped up on [Arc's discord](https://discord.com/channels/880272256100601927/1078256032087805972/1079142054279524552) and the thread of replies helped point me in the right direction. 

I'd need to do a few things:
 
1) Switch to using DynamoDB Local, 
2) Create a middleware to poll the stream for new data
3) Invoke the corresponding function handler when new data is returned from the stream. 

### Using the plugin

1. Add the dependency to your project

`npm install @hicksy/arc-plugin-sandbox-stream`

2. Configure your project to use @tables-streams
3. Setup DynamoDB Local
4. Supply env vars to switch to DynamoDB Local (see connecting to Arc)
4. [optional] Modify the polling interval

The plugin kicks in when a @tables-stream pragma is discovered within your arc config, and queries the table meta data (`describeTable`) and the stream meta data (`describeStream`)  to retrieve iterators for each shard of the table's stream. 

If data is found the plugin invokes the corresponding lambda function using arc's inbuilt invoke function. 

Your function code will receive one or more results off the stream like so:

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

By default the plugin will poll for new stream data every 10 seconds. You can override this by providing an alternate millisecond interval by updating your .arc file

```
@sandbox-table-streams
polling_interval 1000
```


### DynamoDB Local

I'd heard of this being available a while ago but had given it a swerve as I didn't really fancy having to setup and maintain a Docker instance. 

However, this week I learnt that DynamoDB Local is now available within [AWS's NoSQL Workbench tool](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html). 

It's pretty straight forward to setup and use, aside from the following caveats. 

1. Data storage is persistent in the NoSQL Workbench version - I can't find a way to set the inMemory flag available to the standalone / docker version
2. You need to be running NoSQL Workbench while you develop and remember to toggle on DynamoDB Local each time (not a biggie really, but i'td be great to have the means to set it to autostart or run as a start-up background task)
3. The NoSQL Workbench version runs on port 5500, I can't see a way to change this, but it's not a problem for me. 

### Connecting to Arc

Arc makes it really easy to switch out Dynalite for DynamoDB Local. 

There's a couple of env vars you need to set to get your going. 

1. Tell arc that you're using an external db\
2. Change the port used for tables within arc
3. Set your region to `ddblocal`

You can do this one of several ways. 

Either setting an environment variable ARC_DB_EXTERNAL=true / ARC_TABLES_PORT=5500 in an `.env` file, or using the `prefs.arc` file and setting the properties within the @sandbox section [see arc's docs for more info](https://arc.codes/docs/en/reference/configuration/local-preferences#local-preferences)

As DynamoDB Local data is persistent when using the bundled NoSQL Workbench version, you'll need to modify any startup data seeds you have and update them to either conditionally insert data, or what I prefer, to delete the table and re-create it each time - this makes it more in keeping with all my other arc projects. 

Sadly, as Dynalite doesn't support streams, arc's sandbox doesn't create the table with the required 'StreamSpecification' param, so you'll need to supply that either when re-creating the table using `createTable` or supplying it via an `updateTable` call. 

An example StreamSpecifcation looks like:

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


### Get in touch 

I'd love to hear any feedback on this plugin, bugs, or suggestions for improvements so please get in touch on GitHub.

___
