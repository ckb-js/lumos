use futures::Future;
use jsonrpc_core_client::{transports::http, TypedClient};
use neon::prelude::*;
use std::sync::{Arc, Mutex};
use std::{cell::RefCell, ops::Deref};

type BoxedClient = JsBox<Arc<Mutex<Client>>>;

#[derive(Clone)]
pub struct Client {
    pub uri: String,
    pub name: String,
}

impl Client {
    fn set_name(&mut self, name: impl ToString) {
        self.name = name.to_string();
    }
}

fn connect(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let client = cx.argument::<JsBox<Arc<Mutex<Client>>>>(0)?;
    let client = client.lock().unwrap().clone();
    tokio::task::spawn(async move {
        // let client = client.lock().unwrap();
        http::connect::<TypedClient>(&client.uri);
    });
    Ok(cx.undefined())
}

// fn connect(mut cx: FunctionContext) -> JsResult<JsUndefined> {
//     let client = cx.argument::<JsBox<Arc<Mutex<Client>>>>(0)?;
//     let client = client.root(&mut cx);
//     let queue = cx.queue();
//     tokio::task::spawn(async move {
//         queue.send(|mut cx| {
//             let client = client.into_inner(&mut cx);
//             let client = client.lock().unwrap();
//             http::connect::<TypedClient>(&client.uri);
//             Ok(())
//         });
//     });
//     Ok(cx.undefined())
// }

fn set_name(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let client = cx.argument::<JsBox<RefCell<Client>>>(0)?;
    client.borrow_mut().set_name("ClientA");
    Ok(cx.undefined())
}
