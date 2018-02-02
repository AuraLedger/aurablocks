drop table blocks
drop table transactions
go

create table blocks (
    number bigint,
    hash char(66) primary key,
    timestamp bigint,
    difficulty bigint,
    size smallint,
    miner char(42),
    gasUsed int,
    parent char(66),
	 tranCount int
)
go

create index idx_block_number on blocks (number)
create index idx_block_hash on blocks (hash)
go

create table transactions (
    number bigint identity(1,1),
	 blockHash char(66),
    hash char(66),
    source char(42),
    target char(42),
    value bigint,
    gas int,
    gasPrice bigint,
	 status tinyint 
)
go

create index idx_transaction_hash on transactions(hash)
create index idx_transaction_source on transactions(source)
create index idx_transaction_target on transactions(target)
go
