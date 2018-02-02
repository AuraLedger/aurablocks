create procedure insertBlocks
@number bigint, 
@hash char(66),
@parentHash char(66),
@miner char(42),
@difficulty bigint, 
@size int,
@gasUsed int,
@tranCount int,
@timestamp bigint,
as

if not exists (select 1 from blocks where hash = @hash)
	 insert blocks (number, hash, timestamp, difficulty, size, miner, gasUsed, parent, tranCount)
	 values (@number, @hash, @timestamp, @difficulty, @size, @miner, @gasUsed, @parentHash, @tranCount)
go
