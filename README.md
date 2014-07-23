angular-chrome-untappd
==================

A client for untappd's api using angular for use in a chrome extension or
application. You must have a registered api key with untappd.com.

This will provide the ability to authenticate using untappd's oauth api, and the
ability to retrieve

Getting started with Untappd API
--------------------------------

1. You need to get yourself an Untappd ClientID and ClientSecret. To do so, go
complete the [Untappd API Key Form](http://untappd.com/api/register?register=new)
2. Create a chrome extension
3. Find your chrome extensions - for more details view the [google documentation](https://developer.chrome.com/extensions/tut_oauth).
Instructions
------------

### [Optional] Install the module using bower

Install using bower install

    bower install infomofo/angular-chrome-untappd

Add the following script import

```html
    <script src="bower_components/angular-chrome-untappd/angular-chrome-untappd.js"></script>
```

### Import the untappd client module

```javascript
angular.module('myapp',['UntappdClient']);
```

### Add your config with your app id and password to your angular constants

```javascript
app.constant("UNTAPPD_CONFIG",{
  CLIENT_ID: "INSERT YOUR UNTAPPD CLIENT ID HERE"
});
```

Optionally, you can also override

```javascript
    BASE_URL : 'https://untappd.com',
    API_BASE_URL : 'https://api.untappd.com/v4'
```

### Make API Calls

The following api calls are currently supported by the untappd client.

- *UntappdClient.authenticate* - Returns a Promise of the authentication token
for the specified client id with the given extension id
- *UntappdClient.setToken* - If you already have a token, you can set it here
