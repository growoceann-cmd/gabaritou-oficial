:loop  
node src/index.js >> server_run.log 2>&1  
timeout /t 5  
goto loop 
