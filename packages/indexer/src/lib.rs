mod helper;
mod indexer;
mod live_cell_iterator;
mod transaction_iterator;
use indexer::*;
use live_cell_iterator::*;
use neon::prelude::*;
use transaction_iterator::*;

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("newIndexer", new_indexer)?;
    cx.export_function("running", running)?;
    cx.export_function("start", start)?;
    cx.export_function("stop", stop)?;
    cx.export_function("tip", tip)?;
    cx.export_function(
        "getLiveCellsByScriptIterator",
        get_live_cells_by_script_iterator,
    )?;
    cx.export_function(
        "getTransactionsByScriptIterator",
        get_transactions_by_script_iterator,
    )?;
    cx.export_function("collectLiveCells", live_cell_iterator_collect)?;
    cx.export_function("transactionIteratorCollect", transaction_iterator_collect)?;
    cx.export_function("getDetailedLiveCell", get_detailed_live_cell)?;
    cx.export_function("getEmitter", get_emitter)?;
    cx.export_function("getBlockEmitter", get_block_emitter)?;
    Ok(())
}
