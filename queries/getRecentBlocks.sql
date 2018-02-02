/*
returns last 10 blocks. if @lastHashStr is passed, returns blocks newer than that
 */

create procedure getRecentBlocks
@lastHashStr nvarchar(66) null
as

declare @height bigint = (select max(number) from blocks)
declare @lastHeight bigint = @height - 9 

if len(@lastHashStr) = 64
	 select @lastHashStr = "0x" + trim(@lastHashStr)

if len(@lastHashStr) = 66
	 select @lastHeight = number from blocks where hash = convert(binary(32), trim(@lastHashStr), 1)

if @lastHeight < @height - 9
	 select @lastHeight = @height - 9 

select * from blocks where number between @lastHeight and @height

go

