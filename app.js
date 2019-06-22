/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
var crypto = require('crypto');
var log4js = require('log4js');
var fs = require('fs');
var logger = log4js.getLogger('SampleWebApp');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');
var mysql = require('mysql');
var connection = mysql.createConnection({
	host	: 'localhost',
	user	: 'block',
	password	: '1234',
	database	: 'user'
});
connection.connect();

var request = require('request');
require('./config.js');

var hfc = require('fabric-client');

var helper = require('./app/helper.js');
var createChannel = require('./app/create-channel.js');
var join = require('./app/join-channel.js');
var install = require('./app/install-chaincode.js');
var instantiate = require('./app/instantiate-chaincode.js');
var invoke = require('./app/invoke-transaction.js');
var query = require('./app/query.js');
var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
   extended: false
}));
app.post('/blockmonitor', async function(req,res){
	var token = req.body.token;
	var username = req.body.usernmae;
	let message = await query.getChainInfo('peer0.org1.example.com', 'mychannel','admin', 'Org2');
	let message2 = await query.getBlockByNumber('peer0.org1.example.com','mychannel', 1, 'admin', 'Org2');
	let message3 = await query.getBlockByNumber('peer0.org1.example.com','mychannel', 2, 'admin', 'Org2');
	let message4 = await query.getBlockByNumber('peer0.org1.example.com','mychannel', 3, 'admin', 'Org2');
	let message5 = await query.getChannels('peer0.org2.example.com', 'admin', 'Org2');

	message=JSON.stringify(message);
	message2=JSON.stringify(message2);
	message3=JSON.stringify(message3);
	message4=JSON.stringify(message4);
	message5=JSON.stringify(message5);

	var output = `<DOCTYPE html>
			<html>
			<head>
				<title>blockchain monitoring</title>
			</head>
			<body>
				<p><b>channel name&nbsp;</b>${message5}</p>
				<p><b>Chain Information</b></p>
				<p>${message}</p>
				<p><b>Blocks&nbsp;</b></p>
				<p>${message2}</p>
				<p>${message3}</p>
				<p>${message4}</p>
			</body>
			</html>`;
	res.send(output);
});
app.post('/resultmonitor', async function(req,res){
	var token = req.body.token;
	var username = req.body.usernmae;
	let message3 = await query.queryChaincode('peer0.org2.example.com', 'mychannel', 'mycc', ["a"], "query", 'admin', 'Org2');
	let message4 = await query.queryChaincode('peer0.org2.example.com', 'mychannel', 'mycc', ["b"], "query", 'admin', 'Org2');
	var output = `<DOCTYPE html>
			<html>
			<head>
				<title>result monitoring</title>
			</head>
			<body>
				<p>후보자1. 정유나</p>
				<p>득표수: ${message3}</p>
				<p>후보자2. 유소영</p>
				<p>득표수: ${message4}</p>
			</body>
			</html>`;
	res.send(output);
});

app.post('/vote', async function(req,res){
   var token = req.body.token;
   var mypeer = req.body.mypeer;
   var userName = req.body.userName;
   var orgName = req.body.orgName;
   var token = req.body.token;
   var output = `<!DOCTYPE html>
         <html>
            <head>
               <title>vote</title>            
            </head>
            <body>
		<h2>총학생회 투표</h2>
         	<form action='/result' method='post'>
      		<input type="hidden" name="mypeer" value="${mypeer}"/>
      		<input type="hidden" name="userName" value="${userName}"/>
      		<input type="hidden" name="orgName" value="${orgName}"/>
			<input type="hidden" name="token" value="${token}"/>
      		<input type="radio" name="opinion_id" value="정유나">후보1. 정유나<br>
      		<input type="radio" name="opinion_id" value="유소영">후보2. 유소영 <br>
      		<input type="submit" value="Vote!"></input> 
	   	</form>
       	</body>
         </html>`;   
   res.send(output);
   let message = await instantiate.instantiateChaincode('peer0.org2.example.com', 'mychannel', 'mycc', 'v0', 'node', 'Init', ["a","0","b","0"], 'admin', 'Org2');
   //let message2 = await invoke.invokeChaincode(mypeer, 'mychannel', 'mycc', 'move', ["a","b","1"], userName, orgName);
});

app.post('/result', async function(req,res){
var value =req.body.opinion_id;
var mypeer = req.body.mypeer;
var userName = req.body.userName;
var orgName = req.body.orgName;
var token = req.body.token;
connection.query("select * from student where id = '"+userName+"'", async function(err, rows, fields){
	if(!err&&rows[0].votecheck==0){
		var output=`<!DOCTYPE html>
         <html>
            <head>
               <title>result</title>            
            </head>
            <body>
               <p>후보자&nbsp; ${value}에게 투표하셨습니다</p>
            </body>
         </html>`;
		res.send(output);
		if(value=='정유나'){
			   let message2 = await invoke.invokeChaincode('peer0.org2.example.com', 'mychannel', 'mycc', 'move', ["a","1","b","0"], 'admin', 'Org2');
			   let message3 = await query.queryChaincode('peer0.org2.example.com', 'mychannel', 'mycc', ["a"], "query", 'admin', 'Org2'); 
			   let message4 = await query.queryChaincode('peer0.org2.example.com', 'mychannel', 'mycc', ["b"], "query", 'admin', 'Org2'); 
		}
		else if(value=='유소영'){
			   let message2 = await invoke.invokeChaincode('peer0.org2.example.com', 'mychannel', 'mycc', 'move', ["a","0","b","1"], 'admin', 'Org2');
			   let message3 = await query.queryChaincode('peer0.org2.example.com', 'mychannel', 'mycc', ["a"], "query", 'admin', 'Org2');
			   let message4 = await query.queryChaincode('peer0.org2.example.com', 'mychannel', 'mycc', ["b"], "query", 'admin', 'Org2');
		}
   		connection.query("UPDATE student SET votecheck=1 WHERE id='"+userName+"'", async function(err, rows, fields){
		    if(err){
		      console.log(err);
		    } else {
		      console.log(userName+' completed the vote');
		     }
	       });
	}
	else{
		var output=`<!DOCTYPE html>
         <html>
            <head>
               <title>result</title>            
            </head>
            <body>
               <p>이미 투표를 완료하였습니다.</p>
		   <p>투표는 한번만 가능합니다.</p>
            </body>
         </html>`;
		res.send(output);
	}
    });
});

app.get('/',async function(req, res){
   var output =`
   <!DOCTYPE html>
<html>
    <head>
		<meta charset="utf-8">
		        <title>main</title>
        <!-- <link rel="stylesheet" type="text/css" href="./css/frame.css"> -->
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script> 
        <script type="text/javascript" src="js/main.js"></script>
        <style type="text/css">
        	body {
				text-align:center;
				width:900px;
			}

			div#wapper{
				width:1280px;
				min-height:300px;
				text-align:left;
				margin:0 auto;
			}
			
			header,footer,content{
				width: 1280px;
				margin: 5px;
				padding: 10px;
			}
			
			header {
				height: 100px;
			}
			
			content{
				float:left;
				height:700px;
				background-color:#F7BE81;
			}
			
			#login,#sidebar{
				height:250px;
				position:relative;
				float:left;
			}
			#details,#details2{
				position:relative;
				top:40px;
				left:150px;
				float:left;
				width:850px;
				height:500px;
				background-color:white;
			}
			#login{
				background-color:white;
				top:80px;
				left:100px;
				width:200px;
				height:200px;
			}
			#sidebar{
				border-right:2px solid gray;
				top:40px;
				left:90px;
				width:250px;
			}
			#details{
				left:150px;
			}
			#details2{
				left:90px;
			}
			
			.menu{
				cursor:pointer;
				width:100%;
				height:40px;
				border:2px solid gray;
				padding:3px;
				text-align:center;
				color:black;
				font-size:10pt;
				background-color:white;
			}
			.menu:hover{background:grey;color:white;}
			
			footer{
				height:50px;
				background-color:white;
				position:relative;
				clear:both;
			}
			
			#mark{
				vertical-align: middle;
			}
        </style>
    </head>
    <body>
        <div id="wapper">
            <content>
				<form action='/users' method='post'>
                    <div id="login">
                    <center>
						<br><br> <font style="font-size:23px;"><b>전자투표 로그인</b></font>
						
						<br/><br/>
						<input type="text" name="username" placeholder=" ID ">
                        <p><input name = "pass" type="password" placeholder=" PW "/>
                        <p><input type="submit" value="Login"></p>
                    </div>
                    </center>
                </form>
                <div id="details">
                    <br><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;전자투표 일정 및 공지 「학사공지」참조
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;전자투표 매뉴얼 다운로드 (웹용)</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;전자투표 매뉴얼 다운로드 (모바일용)</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;2019학년도 2학기 학생회장단 선거 FAQ</p><!--웹페이지 있다고 가정-->
                    <p><hr></p>
                    
                </div>
            </content>
            <footer>
				개인정보처리방침
            </footer>
        </div>  
            
    </body>
</html>`;
   res.send(output);
   
});

// set secret variable
app.set('secret', 'thisismysecret');
app.use(expressJWT({
   secret: 'thisismysecret'
}).unless({
   path: ['/users']
}));
app.use(bearerToken());
app.use(function(req, res, next) {
   logger.debug(' ------>>>>>> new request for %s',req.originalUrl);
   if (req.originalUrl.indexOf('/users') >= 0) {
      return next();
   }

   var token = req.token;
   jwt.verify(token, app.get('secret'), function(err, decoded) {
      if (err) {
         res.send({
            success: false,
            message: 'Failed to authenticate token. Make sure to include the ' +
               'token returned from /users call in the authorization header ' +
               ' as a Bearer token'
         });
         return;
      } else {
         // add the decoded user name and org name to the request object
         // for the downstream code to use
         req.username = decoded.username;
         req.orgname = decoded.orgName;
         logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
         return next();
      }
   });
});

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, async function(req, res) {
	var token = jwt.sign({
	      exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
	      username: 'admin',
	      orgName: "Org2",
	   }, app.get('secret'));
	let response = await helper.getRegisteredUser('admin', 'Org2', true);
   	logger.debug('-- returned from registering the username admin for organization Org2');
   	if (response && typeof response !== 'string') {
      	logger.debug('Successfully registered the username admin for organization Org2');
      	response.token = token;
	}
	await request.post({ //create channel
                        url: "http://localhost:4000/channels",
                        headers: {
                           "authorization": "Bearer " + token,
                           "Content-Type": "application/json"
                        },
                        body: {
                                "channelName":"mychannel",
                			"channelConfigPath":"../artifacts/channel/mychannel.tx"
                        },
                        json:true
                   }, function(error, response, body){
                      console.log(error);
                      console.log(JSON.stringify(response));
                      console.log(body);
                   });
	await request.post({ //join channel
                        url: "http://localhost:4000/channels/mychannel/peers",
                        headers: {
                           "authorization": "Bearer " + token,
                           "Content-Type": "application/json"
                        },
                        body: {
                                "peers":["peer0.org2.example.com","peer1.org2.example.com"]
                        },
                        json:true
                   }, function(error, response, body){
                      console.log(error);
                      console.log(JSON.stringify(response));
                      console.log(body);
                   });
      await request.post({ //install chaincode
                        url: "http://localhost:4000/chaincodes",
                        headers: {
                           "authorization": "Bearer " + token,
                           "Content-Type": "application/json"
                        },
                        body: {
                                "peers":"peer0.org2.example.com",
                			 "chaincodeName":"mycc",
                			 "chaincodePath": "artifacts/src/github.com/example_cc/node",
                			 "chaincodeType":"node",
                			 "chaincodeVersion":"v0"
                        },
                        json:true
                   }, function(error, response, body){
                      console.log(error);
                      console.log(JSON.stringify(response));
                      console.log(body);
                   });
});
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************',host,port);
server.timeout = 240000;

function getErrorMessage(field) {
   var response = {
      success: false,
      message: field + ' field is missing or Invalid in the request'
   };
   return response;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Register and enroll user
app.post('/users', async function(req, res) {
   var username = req.body.username;
   var pass = req.body.pass;
   var pass2;
   pass = crypto.createHash('sha512').update(pass).digest('base64');
   console.log(pass);
   var univName="";
   var univNameK="";//web
   var departmentK="";//web
   var peers;
   var mypeer; 
   var orgName="Org1";
   var flag=0;
   var output2 = `<!DOCTYPE html>
            <html>
               <head>
               <meta charset="utf-8">
               <title>my page</title>
               </head>
               <body>
			<p>아이디와 비밀번호를 체크하시오</p>
			<a href="/">back</a>
               </body>
            </html>`;
   connection.query("select * from student where id = '"+username+"' and password = '"+pass+"'", async function(err, rows, fields){
	if(err){//디비 에러
		console.log(err);
      	res.send(output2);
	}
	else if(rows.length>0){//아이디가 학생 아이디인 경우
		univName = rows[0].univ;
   		if(univName=='engineer'){
			univNameK='공과대학';
			if(rows[0].department=='computer')
				departmentK='컴퓨터공학과';
			else
				departmentK='전자전기공학과';
      		mypeer = 'peer0.org1.example.com';
      		peers = ['peer0.org1.example.com','peer1.org1.example.com'];
   		}
   		else if(univName=='science'){
			univNameK='이과대학';
			if(rows[0].department=='math')
				departmentK='수학과';
			else
				departmentK='화학과';
      		mypeer = 'peer1.org1.example.com';
      		peers = ['peer0.org1.example.com','peer1.org1.example.com'];
   		}
   logger.debug('End point : /users');
   logger.debug('User name : ' + username);

   if (!username) {
      res.json(getErrorMessage('\'username\''));
      return;
   }
   var token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
      username: username,
      orgName: "Org1",
   }, app.get('secret'));
   let response = await helper.getRegisteredUser(username, orgName, true);
   logger.debug('-- returned from registering the username %s for organization %s',username,orgName);
   if (response && typeof response !== 'string') {
      logger.debug('Successfully registered the username %s for organization %s',username,orgName);
      response.token = token;
      var channelName='mychannel';
      var channelConfigPath='../artifacts/channel/mychannel.tx';
      
      await request.post({ //join channel
                        url: "http://localhost:4000/channels/"+channelName+"/peers",
                        headers: {
                           "authorization": "Bearer " + token,
                           "Content-Type": "application/json"
                        },
                        body: {
                                "peers":peers
                        },
                        json:true
                   }, function(error, response, body){
                      console.log(error);
                      console.log(JSON.stringify(response));
                      console.log(body);
                   });
      
      var output = `<!DOCTYPE html>
            <html>
               <head>
               <meta charset="utf-8">
               <title>my page</title>
               </head>
               <body>
		<table border=0>
		<tr>
               <td>학번</td>
               <td align="center">${username}</td>
		</tr>
		<tr>
               <td>단과대</td>
               <td align="center">${univNameK}</td>
		</tr>
		<tr>
               <td>학과</td>
               <td align="center">${departmentK}</td>
		</tr>
		<tr>
               <form action='/vote' method='post'>
                  <input type="hidden" name="userName" value="${username}">
                  <input type="hidden" name="orgName" value="${orgName}">
                  <input type ="hidden" name="token" value="${token}">
                  <input type ="hidden" name="mypeer" value="${mypeer}">
                <tr><td>  <input type="submit" value="총학생회장투표"/></td></tr>
               </form>
		</table>
               </body>
            </html>`;
      
      res.send(output);
   } else {
      logger.debug('Failed to register the username %s for organization %s with::%s',username, orgName, response);
      res.send('failed to register');
   }
	}
	else{//아이디가 틀리거나 아이디가 관리자인 경우
		connection.query("select * from admin where id = '"+username+"' and password = '"+pass+"'", async function(err2, rows2, fields2){
			if(rows2.length>0){//아이디가 관리자인 경우
				var token = jwt.sign({
				      exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
				      username: username,
				      orgName: "Org2",
				   }, app.get('secret'));
   				let response = await helper.getRegisteredUser(username, orgName, true);
				var output3 = `<!DOCTYPE html>
				    <html>
				       <head>
				       <meta charset="utf-8">
				       <title>admin page</title>
				       </head>
				       <body>
						<p>관리자: ${username}</p>
						<p>
						<form action="/blockmonitor" method="post">
							<input type="hidden" name="token" value="${token}"/>
							<input type="hidden" name="username" value="${username}"/>
							<input type="submit" value="블록 체인 모니터링"/>
						</form>
						</p>
						<p>
						<form action="/resultmonitor" method="post">
							<input type="hidden" name="token" value="${token}"/>
							<input type="hidden" name="username" value="${username}"/>
							<input type="submit" value="투표 현황"/>
						</form>
						</p>
				       </body>
				    </html>`;
							res.send(output3);
			}
			else{//아이디가 틀리거나
				res.send(output2);
			}
		});
	}
   });

});

// Create Channel
app.post('/channels', async function(req, res) {
   logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
   logger.debug('End point : /channels');
   var channelName = req.body.channelName;
   var channelConfigPath = req.body.channelConfigPath;
   logger.debug('Channel name : ' + channelName);
   logger.debug('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx
   if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
   }
   if (!channelConfigPath) {
      res.json(getErrorMessage('\'channelConfigPath\''));
      return;
   }
   let message = await createChannel.createChannel(channelName, channelConfigPath, req.username, req.orgname);
   //res.json(message);
   res.send(message);
});
// Join Channel
app.post('/channels/:channelName/peers', async function(req, res) {
   logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
   var channelName = req.params.channelName;
   var peers = req.body.peers;
   logger.debug('channelName : ' + channelName);
   logger.debug('peers : ' + peers);
   logger.debug('username :' + req.username);
   logger.debug('orgname:' + req.orgname);

   if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
   }
   if (!peers || peers.length == 0) {
      res.json(getErrorMessage('\'peers\''));
      return;
   }

   let message =  await join.joinChannel(channelName, peers, req.username, req.orgname);
   res.send(message);
});
// Install chaincode on target peers
app.post('/chaincodes', async function(req, res) {
   logger.debug('==================== INSTALL CHAINCODE ==================');
   var peers = req.body.peers;
   var chaincodeName = req.body.chaincodeName;
   var chaincodePath = req.body.chaincodePath;
   var chaincodeVersion = req.body.chaincodeVersion;
   var chaincodeType = req.body.chaincodeType;
   logger.debug('peers : ' + peers); // target peers list
   logger.debug('chaincodeName : ' + chaincodeName);
   logger.debug('chaincodePath  : ' + chaincodePath);
   logger.debug('chaincodeVersion  : ' + chaincodeVersion);
   logger.debug('chaincodeType  : ' + chaincodeType);
   if (!peers || peers.length == 0) {
      res.json(getErrorMessage('\'peers\''));
      return;
   }
   if (!chaincodeName) {
      res.json(getErrorMessage('\'chaincodeName\''));
      return;
   }
   if (!chaincodePath) {
      res.json(getErrorMessage('\'chaincodePath\''));
      return;
   }
   if (!chaincodeVersion) {
      res.json(getErrorMessage('\'chaincodeVersion\''));
      return;
   }
   if (!chaincodeType) {
      res.json(getErrorMessage('\'chaincodeType\''));
      return;
   }
   let message = await install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.username, req.orgname)
   res.send(message);});
// Instantiate chaincode on target peers
app.post('/channels/:channelName/chaincodes', async function(req, res) {
   logger.debug('==================== INSTANTIATE CHAINCODE ==================');
   var peers = req.body.peers;
   var chaincodeName = req.body.chaincodeName;
   var chaincodeVersion = req.body.chaincodeVersion;
   var channelName = req.params.channelName;
   var chaincodeType = req.body.chaincodeType;
   var fcn = req.body.fcn;
   var args = req.body.args;
   logger.debug('peers  : ' + peers);
   logger.debug('channelName  : ' + channelName);
   logger.debug('chaincodeName : ' + chaincodeName);
   logger.debug('chaincodeVersion  : ' + chaincodeVersion);
   logger.debug('chaincodeType  : ' + chaincodeType);
   logger.debug('fcn  : ' + fcn);
   logger.debug('args  : ' + args);
   if (!chaincodeName) {
      res.json(getErrorMessage('\'chaincodeName\''));
      return;
   }
   if (!chaincodeVersion) {
      res.json(getErrorMessage('\'chaincodeVersion\''));
      return;
   }
   if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
   }
   if (!chaincodeType) {
      res.json(getErrorMessage('\'chaincodeType\''));
      return;
   }
   if (!args) {
      res.json(getErrorMessage('\'args\''));
      return;
   }

   let message = await instantiate.instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, req.username, req.orgname);
   res.send(message);
});
// Invoke transaction on chaincode on target peers
app.post('/channels/:channelName/chaincodes/:chaincodeName', async function(req, res) {
   logger.debug('==================== INVOKE ON CHAINCODE ==================');
   var peers = req.body.peers;
   var chaincodeName = req.params.chaincodeName;
   var channelName = req.params.channelName;
   var fcn = req.body.fcn;
   var args = req.body.args;
   logger.debug('channelName  : ' + channelName);
   logger.debug('chaincodeName : ' + chaincodeName);
   logger.debug('fcn  : ' + fcn);
   logger.debug('args  : ' + args);
   if (!chaincodeName) {
      res.json(getErrorMessage('\'chaincodeName\''));
      return;
   }
   if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
   }
   if (!fcn) {
      res.json(getErrorMessage('\'fcn\''));
      return;
   }
   if (!args) {
      res.json(getErrorMessage('\'args\''));
      return;
   }

   let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
   res.send(message);
});
// Query on chaincode on target peers
app.get('/channels/:channelName/chaincodes/:chaincodeName', async function(req, res) {
   logger.debug('==================== QUERY BY CHAINCODE ==================');
   var channelName = req.params.channelName;
   var chaincodeName = req.params.chaincodeName;
   let args = req.query.args;
   let fcn = req.query.fcn;
   let peer = req.query.peer;

   logger.debug('channelName : ' + channelName);
   logger.debug('chaincodeName : ' + chaincodeName);
   logger.debug('fcn : ' + fcn);
   logger.debug('args : ' + args);

   if (!chaincodeName) {
      res.json(getErrorMessage('\'chaincodeName\''));
      return;
   }
   if (!channelName) {
      res.json(getErrorMessage('\'channelName\''));
      return;
   }
   if (!fcn) {
      res.json(getErrorMessage('\'fcn\''));
      return;
   }
   if (!args) {
      res.json(getErrorMessage('\'args\''));
      return;
   }
   args = args.replace(/'/g, '"');
   args = JSON.parse(args);
   logger.debug(args);

   let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
   res.send(message);
});
//  Query Get Block by BlockNumber
app.get('/channels/:channelName/blocks/:blockId', async function(req, res) {
   logger.debug('==================== GET BLOCK BY NUMBER ==================');
   let blockId = req.params.blockId;
   let peer = req.query.peer;
   logger.debug('channelName : ' + req.params.channelName);
   logger.debug('BlockID : ' + blockId);
   logger.debug('Peer : ' + peer);
   if (!blockId) {
      res.json(getErrorMessage('\'blockId\''));
      return;
   }

   let message = await query.getBlockByNumber(peer, req.params.channelName, blockId, req.username, req.orgname);
   res.send(message);
});
// Query Get Transaction by Transaction ID
app.get('/channels/:channelName/transactions/:trxnId', async function(req, res) {
   logger.debug('================ GET TRANSACTION BY TRANSACTION_ID ======================');
   logger.debug('channelName : ' + req.params.channelName);
   let trxnId = req.params.trxnId;
   let peer = req.query.peer;
   if (!trxnId) {
      res.json(getErrorMessage('\'trxnId\''));
      return;
   }

   let message = await query.getTransactionByID(peer, req.params.channelName, trxnId, req.username, req.orgname);
   res.send(message);
});
// Query Get Block by Hash
app.get('/channels/:channelName/blocks', async function(req, res) {
   logger.debug('================ GET BLOCK BY HASH ======================');
   logger.debug('channelName : ' + req.params.channelName);
   let hash = req.query.hash;
   let peer = req.query.peer;
   if (!hash) {
      res.json(getErrorMessage('\'hash\''));
      return;
   }

   let message = await query.getBlockByHash(peer, req.params.channelName, hash, req.username, req.orgname);
   res.send(message);
});
//Query for Channel Information
app.get('/channels/:channelName', async function(req, res) {
   logger.debug('================ GET CHANNEL INFORMATION ======================');
   logger.debug('channelName : ' + req.params.channelName);
   let peer = req.query.peer;

   let message = await query.getChainInfo(peer, req.params.channelName, req.username, req.orgname);
   res.send(message);
});
//Query for Channel instantiated chaincodes
app.get('/channels/:channelName/chaincodes', async function(req, res) {
   logger.debug('================ GET INSTANTIATED CHAINCODES ======================');
   logger.debug('channelName : ' + req.params.channelName);
   let peer = req.query.peer;

   let message = await query.getInstalledChaincodes(peer, req.params.channelName, 'instantiated', req.username, req.orgname);
   res.send(message);
});
// Query to fetch all Installed/instantiated chaincodes
app.get('/chaincodes', async function(req, res) {
   var peer = req.query.peer;
   var installType = req.query.type;
   logger.debug('================ GET INSTALLED CHAINCODES ======================');

   let message = await query.getInstalledChaincodes(peer, null, 'installed', req.username, req.orgname)
   res.send(message);
});
// Query to fetch channels
app.get('/channels', async function(req, res) {
   logger.debug('================ GET CHANNELS ======================');
   logger.debug('peer: ' + req.query.peer);
   var peer = req.query.peer;
   if (!peer) {
      res.json(getErrorMessage('\'peer\''));
      return;
   }

   let message = await query.getChannels(peer, req.username, req.orgname);
   res.send(message);
});
