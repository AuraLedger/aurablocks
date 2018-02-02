/*
returns last 10 transactions. if @lastHashStr is passed, returns transactions newer than that
 */

create procedure getRecentTransactions
@lastHashStr nvarchar(66) null
as

declare @height bigint = (select max(number) from transactions)
declare @lastHeight bigint = @height - 9 

if len(@lastHashStr) = 64
	 select @lastHashStr = "0x" + trim(@lastHashStr)

if len(@lastHashStr) = 66
	 select @lastHeight = number from transactions where hash = convert(varbinary(32), trim(@lastHashStr), 1)

if @lastHeight < @height - 9
	 select @lastHeight = @height - 9 

select * from transactions where number between @lastHeight and @height

go

