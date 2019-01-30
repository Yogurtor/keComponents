import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, Progress } from 'antd';
import Fetch from '@/utils/fetch';

/*
 * params
 * exportUrl: 导出url
 * exportParams: 导出参数,{}
 * statusUrl: 获取状态和进度
 * [STATUSCODE]: 状态码: 0. 待执行 1. 执行中 2. 成功 3. 失败'
 */

export default class NHExport extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            task_id: null,
            visible: false,
            exportTaskStore: {
                id: '', // task_id
                status: '',
                file_url: '', // url
                progress: 0,
            }
        };
    }

    static propTypes = {
        text: PropTypes.any,
        STATUSCODE: PropTypes.object,
        statusUrl: PropTypes.string,
        exportUrl: PropTypes.string,
        exportParams: PropTypes.object,
    };

    static defaultProps = {
        text: '导出',
        STATUSCODE: {
            FAIL: 3,
            SUCCESS: 2
        }
    }

    fetchexportTaskData = (statusUrl, params) => {
        const _this = this;
        Fetch.get({ url: statusUrl, params }).then((data) => {
            if (data.errno == 0) {
                _this.setState({ exportTaskStore: data.data });
                if (data.data.progress == 100) {
                    clearInterval(_this.timer);
                }
            }
        });
    }

    Loop() {
        this.fetchexportTaskData(this.props.statusUrl, { id: this.state.task_id, task_id: this.state.task_id });
        this.timer = setInterval(() => {
            this.fetchexportTaskData(this.props.statusUrl, { id: this.state.task_id, task_id: this.state.task_id });
        }, 5000);
    }

    handleClick = () => {
        const { exportUrl, exportParams } = this.props;
        Fetch.post({ url: exportUrl, params: exportParams }).then((res) => {
            if (res.errno == 0) {
                this.setState({
                    task_id: res.data.id || res.data.task_id,
                    visible: true
                }, () => {
                    this.Loop();
                });
            }
        });
    }

    handleCancel = () => {
        clearInterval(this.timer);
        this.setState({ visible: false, }, () => {
            this.setState({ exportTaskStore: { progress: 0 } });
        });
    }

    handleOk = () => {
        setTimeout(() => {
            this.setState({ visible: false, }, () => {
                this.setState({ exportTaskStore: { progress: 0 } });
            });
        }, 3000);
        clearInterval(this.timer);
    }

    okButton = () => {
        const { status, file_url, url } = this.state.exportTaskStore;
        return (
            <a className="ok-button" href={status == 2 && file_url ? file_url : url || ''} download="download" key="download">
                <Button key="submit" type="primary" size="large" onClick={this.handleOk}>
                    下载
                </Button>
            </a>
        );
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    render() {
        const { text, exportUrl, exportParams, statusUrl, STATUSCODE, ...props } = this.props;
        const { visible } = this.state;
        const { status, progress } = this.state.exportTaskStore;
        return (
            <div {...props}>
                <Button
                    type="primary"
                    onClick={this.handleClick}
                    {...props}
                >{text}
                </Button>
                <Modal
                    title={status == STATUSCODE.FAIL ? '导出失败' : '正在努力导出'}
                    visible={visible}
                    closable={false}
                    maskClosable={false}
                    footer={[
                        <Button key="back" size="large" onClick={this.handleCancel}>取消</Button>,
                        status == STATUSCODE.SUCCESS ? this.okButton() : null
                    ]}
                >
                    <Progress
                        percent={progress}
                        status={(() => {
                            if (status == STATUSCODE.SUCCESS) {
                                return 'success';
                            }
                            if (status == STATUSCODE.FAIL) {
                                return 'exception';
                            }

                            return 'active';
                        })()}
                    />
                </Modal>
            </div>
        );
    }
}
