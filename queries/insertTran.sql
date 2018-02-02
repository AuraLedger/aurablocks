create procedure insertTran
@hash char(66),
@blockHash char(66),
@from char(42),
@to char(42),
@value bigint, 
@gasPrice bigint,
@gas int,
@status tinyint,
as

if not exists (select 1 from transactions where hash = @hash)
begin
	 insert transactions (hash, blockHash, source, target, value, gas, gasPrice, status)
	 values (@hash, @blockHash, @from, @to, @value, @gas, @gasPrice, @status)
end
go
