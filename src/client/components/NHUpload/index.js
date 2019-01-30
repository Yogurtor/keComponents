import React from 'react';
import { Upload, Button, Icon, message } from 'antd';
import './index.less';

 /* 
  * @params:
  * action
  * onChange
  * file / fileList
  * mode
  * maxLength
  * inline
  * accept
  * config
  * multiple
  * showUploadList
  */

 /* 
  * status:
  * uploading percent=0
  * uploading percent=100
  * done
  * removed
  * error
  */

 /*
  * 理想流程，使用props
  * props.fileList -> onChange(file) -> callback(file.response.data) => props.fileList
  * 不能实现。原因：对于受控模式，你应该在 onChange 中始终 setState fileList，保证所有状态同步到 Upload 内。
  *  
  * 迂回， 使用state
  * props.fileList -> state.fileList -> onChange(file) ->setState({})、callback => state.fileList
  * state.fileList中， 保持可用模式( {url,id,name} )
  * props.fileList中， 保持可传模式( response.data )
  * 
  * antd Upload需注意：
  * 组件内部status=='done', 接口不一定errno==0
 */

// file结构转换：传入config={url:'url', name:'name', uid:'id' }
const transer = (file, config={})=>{
    var _file={};
    var keys=Object.keys(file); 
    _file.uid = config.uid?file[config.uid]:file[keys.filter(p=>p.substr(-2)=='id')[0]];
    _file.url = config.url?file[config.url]:file[keys.filter(p=>p.substr(-3)=='url')[0]];
    _file.name = config.name?file[config.name]:file[keys.filter(p=>p.substr(-4)=='name')[0]];
    return _file;
}


export default class NHUpload extends React.Component{

    state={
        fileList: this.props.file?[transer(this.props.file)]:this.props.fileList?this.props.fileList.map(p=>transer(p)):[]  
    };

    onClick=(e)=>{
        if(this.state.fileList.length==this.props.maxLength||(this.props.file||this.props.mode=='single')&&this.state.fileList.length==1){
            message.warning(`最多支持上传 ${this.props.maxLength|| 1} 个文件`);
            e.stopPropagation()
        }
    }

    onChange = ({ file, fileList }) =>{
        if (file.status === 'done' && file.response) {
            if(file.response.errno==0){
                message.success(`${file.name} 上传成功`);
            }else{
                message.error(file.response.error);
            }
        } else if (file.status === 'error') {
            message.error(`${file.name} 上传失败.`);
        }
        // 过滤response.error, 添加url
        fileList = fileList.filter((file) => (!(file.response&&file.response.errno!=0))).map(f=>{
            if(f.response){
                f.url = transer(f.response.data).url;
            }
            return f;
        });

        this.setState({
            fileList: fileList
        });

        // callback, 添加文件成功或删除文件触发
        if(file.response && file.response.errno==0||file.status=='removed'){
            const _fileList = fileList.map(r=>r.response?r.response.data:r);
            if(this.props.file||this.props.mode==='single'){
                this.props.onChange&&this.props.onChange(r.response.data)
            }else{
                this.props.onChange&&this.props.onChange(_fileList)
            }
            
        }
    }

    render(){
        const { action} = this.props;
        const {fileList} = this.state;
        return (
        <Upload
            className={`NHUpload ${this.props.inline!==false?'NHUpload-inline':''}`}
            action={ action|| '' }
            fileList={fileList}
            onChange={this.onChange}
            showUploadList={this.props.showUploadList===false?false:true}
            multiple={this.props.multiple===false?false:true}
            accept={this.props.accept}
            openFileDialogOnClick={false}
        >
            <Button 
                className="NHUpload-btn"
                onClick={(e)=>this.onClick(e)}
            >
                <Icon type="upload" /> {this.props.btnText||'上传附件'}
            </Button>
        </Upload>
        )
    }
}