#!/usr/bin/env node

const server = require('fastify')();
const fetch = require('node-fetch');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 3000;
const TARGET = process.env.TARGET || 'localhost:4000';
const SDC = require('statsd-client');
const statsd = new(require('statsd-client'))({
    host:'localhost',
    port: 8125,
    prefix: 'web-api'
});

(async ()=> {
    await server.register(require('middie'));

    //middleware to log incoming requests
    server.use(statsd.helpers.getExpressMiddleware('inbound', {
        timeByUrl: true
    }));


    server.get('/', async () => {
        const begin = new Date();
        const url = `http://${TARGET}/recipes/42`;
        const req = await fetch(url);

        statsd.timing('outbound.recipe-api.request-time', begin);
        statsd.increment('outbound.recipe-api.request-count');

        const producer_data = await req.json();
    
        return{
            consumer_pid: process.pid,
            producer_data
        };
    });
    server.get('/error', async () => { 
        throw new Error('oh no'); 
    });
    server.listen(PORT, HOST, ()=>{
        console.log(`Consumer running at http://${HOST}:${PORT}`);
    });
})();

const v8 = require('v8');
const fs = require('fs');

setInterval(()=>{
    statsd.gauge('server.conn', server.server._connections);
    
    const m = process.memoryUsage();
    statsd.gauge('server.memory.used', m.heapUsed);
    statsd.gauge('server.memory.total', m.heapTotal);

    const h = v8.getHeapStatistics();
    statsd.gauge('server.heap.size', h.used_heap_size);
    statsd.gauge('server.heap.limit', h.heap_size_limit);

    fs.readdir('/proc/self/fd', (err, list) => {
        if (err) return;
        statsd.gauge('server.descriptors', list.length);
      });
    
      const begin = new Date();
      setTimeout(() => { statsd.timing('eventlag', begin); }, 0);

}, 10000);
//NODE_DEBUG=statsd-client node consumer-http-metrics.js
