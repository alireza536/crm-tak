import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {

constructor(
 @InjectRepository(User) private users: Repository<User>
){}




// ======================
// لیست کاربران
// ======================

async findAll(){

return this.users.find({
select:{ id:true, name:true, phone:true, role:true, createdAt:true },
order:{ id:'DESC' }
});

}




// ======================
// ساخت کاربر
// ======================

async create(data:any){


const hash =
await bcrypt.hash(
data.password,
10
);



const user = await this.users.save(this.users.create({
name:data.name, phone:data.phone, address:data.address || '',
personCode:data.personCode || '', password:hash, role:data.role || 'SALES'
}));
return { id:user.id, name:user.name, phone:user.phone, role:user.role };


}



// ======================
// یک کاربر
// ======================

async findOne(id:number){


return this.users.findOne({ where:{ id }, select:{ id:true, name:true, phone:true, role:true } });


}



// ======================
// حذف
// ======================

async remove(id:number){


const user = await this.users.findOneByOrFail({ id });
return this.users.remove(user);


}



}
