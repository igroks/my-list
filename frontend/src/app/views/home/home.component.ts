import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSelectionList } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ItemProps } from './home.model';
import { HomeService } from './home.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit{
  @ViewChild('selected') selected!: MatSelectionList;
  listItemMap = {
    db1: [],
    db2: [],
  };
  items: ItemProps[] = [];
  nameControl = new FormControl('',[Validators.required, Validators.minLength(1)]);
  databaseForm!: FormGroup;
  formSubmitedd = false;
  sortedBy = {
    key: 'database',
    reverse: false
  }

  constructor(
    private homeService: HomeService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ){ }

  ngOnInit(): void {
    this.loadItem('db1');
    this.loadItem('db2');
    this.databaseForm = this.fb.group({
      db1: false,
      db2: false
    })
  }

  reloadItems(){
    this.items = this.listItemMap.db1.concat(this.listItemMap.db2);
    this.sort(this.sortedBy.key);
  }

  loadItem(db: string){
    this.homeService.getItems(db).subscribe((res) => {
      if(!!res){
        res.forEach((r: any) => r.database = db);
        (this.listItemMap as any)[db] = res;
      }
      this.reloadItems();
    });
  }

  isDatabasesValid(){
    return !(this.databaseForm.controls['db1'].value || this.databaseForm.controls['db2'].value) && this.formSubmitedd;
  }

  isNameValid() {
    return !this.nameControl.valid && this.formSubmitedd;
  }

  createItem(){
    this.formSubmitedd = true;
    if(this.nameControl.valid && this.databaseForm.valid){
      let item: ItemProps = {
        name: `${this.nameControl.value}`,
        createdAt: new Date()
      };
      let databaseMap = this.databaseForm.value;
      let databases = Object.keys(databaseMap).filter((database) => databaseMap[database]);

      databases.forEach((database) => this.homeService.insertItem(item, database).subscribe(
        () => {
          this.snackBar.open('Item inserido com sucesso', 'OK', {
            panelClass: ['snack-success']
          });
          this.loadItem(database);
          this.nameControl.reset();
          this.formSubmitedd = false;
        },
        () => {
          this.snackBar.open('Erro ao inserir item', 'OK', {
            panelClass: ['snack-fail']
          });
        }
      ));
    } else {
      this.nameControl.updateValueAndValidity();
      this.databaseForm.updateValueAndValidity();
    }
  }

  removeItems(){
    this.selected.selectedOptions.selected.forEach(
      (selected) => this.homeService.deleteItem(selected.value, selected.value.database).subscribe(() => {
        this.loadItem(selected.value.database);
      })
    );
  }

  sort(key: string){
    this.sortedBy.key = key;
    if(this.sortedBy.reverse){
      this.items = this.items.sort((a: any, b: any) => {
        if (a[key] > b[key]) {
          return -1;
        } else if (a[key] < b[key]) {
            return 1;
        }
        return 0;
      });
    }else{
      this.items = this.items.sort((a: any, b: any) => {
        if (a[key] > b[key]) {
          return 1;
        } else if (a[key] < b[key]) {
            return -1;
        }
        return 0;
      });
    }
  }

  reverseSort(){
    this.sortedBy.reverse = !this.sortedBy.reverse;
    this.sort(this.sortedBy.key);
  }
}
