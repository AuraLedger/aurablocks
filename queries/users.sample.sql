create login node with password = 'node_password'
create login api with password = 'api_password'
go

create user node for login node
create user api for login api
go

grant insert, update on blocks to node
grant insert, update on transactions to node
grant select on blocks to api
grant select on transactions to api


